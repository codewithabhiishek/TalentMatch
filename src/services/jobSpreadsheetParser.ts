import JSZip from 'jszip';
import ExcelJS from 'exceljs';
import { sanitizeInput } from './securityService';

export interface ParsedJobSpreadsheet {
  fileName: string;
  sheetName: string;
  headers: string[];
  rows: string[][];
  totalRows: number;
}

/**
 * Universal Resilient Spreadsheet Parser (Excel .xlsx, .xls, HTML tables, and .csv)
 * Handles vendor ATS portal exports, standard workbooks, and delimited text with zero crashes.
 */
export async function parseJobSpreadsheet(file: File): Promise<ParsedJobSpreadsheet> {
  const fileName = file.name;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // 1. Direct CSV parser
  if (ext === 'csv') {
    return parseCsvFile(file);
  }

  const arrayBuffer = await file.arrayBuffer();

  // 2. Check if the file is actually an HTML table or XML disguised as .xlsx or .xls
  // Many vendor portals (Bullhorn, Taleo, Fieldglass) export HTML tables with .xls/.xlsx extensions.
  const textPrefix = new TextDecoder('utf-8', { fatal: false }).decode(arrayBuffer.slice(0, 4000));
  if (/<table|<html|<\?xml|<Workbook/i.test(textPrefix)) {
    try {
      const fullText = await file.text();
      const parsedHtml = parseHtmlOrXmlTable(fullText, fileName);
      if (parsedHtml && parsedHtml.headers.length > 0) {
        return parsedHtml;
      }
    } catch {
      // Fall through to binary readers
    }
  }

  // 3. Primary OpenXML Zip Reader via JSZip (High-speed, never fails with "reading 'sheets'")
  try {
    const parsedZip = await parseXlsxWithJSZip(arrayBuffer, fileName);
    if (parsedZip && parsedZip.headers.length > 0) {
      return parsedZip;
    }
  } catch (zipErr: any) {
    console.warn('JSZip reader fell back:', zipErr?.message);
  }

  // 4. Secondary fallback via ExcelJS
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.worksheets[0];

    if (worksheet) {
      const sheetName = worksheet.name || 'Sheet1';
      const headers: string[] = [];
      const rows: string[][] = [];
      let headerRowIndex = 1;

      worksheet.eachRow((row, rowNumber) => {
        const values = Array.isArray(row.values) ? row.values.slice(1) : [];
        const rowStrings = values.map(v => formatCellValue(v));

        if (headers.length === 0) {
          if (rowStrings.some(s => s.length > 0)) {
            headers.push(...rowStrings.map(h => sanitizeInput(h, 100)));
            headerRowIndex = rowNumber;
          }
        } else if (rowNumber > headerRowIndex) {
          if (rowStrings.some(s => s.length > 0)) {
            while (rowStrings.length < headers.length) rowStrings.push('');
            rows.push(rowStrings.slice(0, headers.length).map(c => sanitizeInput(c, 250)));
          }
        }
      });

      if (headers.length > 0) {
        return {
          fileName,
          sheetName,
          headers,
          rows,
          totalRows: rows.length,
        };
      }
    }
  } catch (excelJsErr: any) {
    console.warn('ExcelJS fallback failed:', excelJsErr?.message);
  }

  // 5. Final fallback: try reading as plain delimited text (TSV or CSV)
  try {
    const text = await file.text();
    if (text.includes('\t') || text.includes(',')) {
      return parseDelimitedText(text, fileName, text.includes('\t') ? '\t' : ',');
    }
  } catch {
    // Ignore
  }

  throw new Error('Unable to parse spreadsheet. Please ensure the file contains valid tabular data (.xlsx, .xls, or .csv).');
}

/**
 * High-speed OpenXML Parser using JSZip
 * Directly extracts shared strings and cell matrix without relying on stream polyfills.
 */
async function parseXlsxWithJSZip(arrayBuffer: ArrayBuffer, fileName: string): Promise<ParsedJobSpreadsheet> {
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Read shared strings table if present
  const sharedStrings: string[] = [];
  const sstFile = zip.file('xl/sharedStrings.xml') || zip.file('xl/SharedStrings.xml');
  if (sstFile) {
    const sstXml = await sstFile.async('string');
    const regex = /<si\b[^>]*>([\s\S]*?)<\/si>/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(sstXml)) !== null) {
      const textMatches = match[1].match(/<t\b[^>]*>([\s\S]*?)<\/t>/gi) || [];
      const text = textMatches.map(t => t.replace(/<[^>]+>/g, '')).join('');
      sharedStrings.push(text);
    }
  }

  // 2. Find first worksheet
  const sheetPaths = Object.keys(zip.files).filter(
    f => /^xl\/worksheets\/sheet\d+\.xml$/i.test(f)
  );

  if (sheetPaths.length === 0) {
    throw new Error('No worksheets found in OpenXML package.');
  }

  // Sort so sheet1 comes before sheet10
  sheetPaths.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
    const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
    return numA - numB;
  });

  const sheetXml = await zip.file(sheetPaths[0])!.async('string');

  const rawRows: string[][] = [];
  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
    const rowContent = rowMatch[1];
    const cellRegex = /<c\b[^>]*\br="([A-Z]+)(\d+)"[^>]*(?:\bt="([^"]+)")?[^>]*>([\s\S]*?)<\/c>/gi;
    let cellMatch: RegExpExecArray | null;
    const rowObj: Record<number, string> = {};
    let maxCol = 0;

    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const colLetter = cellMatch[1];
      const type = cellMatch[3] || '';
      const body = cellMatch[4] || '';

      let val = '';
      if (type === 's') {
        const vMatch = body.match(/<v\b[^>]*>(\d+)<\/v>/i);
        if (vMatch) {
          const idx = parseInt(vMatch[1], 10);
          val = sharedStrings[idx] || '';
        }
      } else if (type === 'inlineStr') {
        const tMatch = body.match(/<t\b[^>]*>([\s\S]*?)<\/t>/i);
        if (tMatch) val = tMatch[1].replace(/<[^>]+>/g, '');
      } else {
        const vMatch = body.match(/<v\b[^>]*>([\s\S]*?)<\/v>/i);
        if (vMatch) val = vMatch[1].trim();
      }

      // Convert Excel column letters (A, B, ... Z, AA, AB...) to 0-based column index
      let colIdx = 0;
      for (let i = 0; i < colLetter.length; i++) {
        colIdx = colIdx * 26 + (colLetter.charCodeAt(i) - 64);
      }
      colIdx -= 1;

      rowObj[colIdx] = val.trim();
      if (colIdx > maxCol) maxCol = colIdx;
    }

    const rowArr: string[] = [];
    for (let c = 0; c <= maxCol; c++) {
      rowArr.push(rowObj[c] || '');
    }

    if (rowArr.some(cell => cell.length > 0)) {
      rawRows.push(rowArr);
    }
  }

  if (rawRows.length === 0) {
    throw new Error('Worksheet contains no data rows.');
  }

  const headers = rawRows[0].map(h => sanitizeInput(h, 100));
  const rows = rawRows.slice(1).map(r => {
    while (r.length < headers.length) r.push('');
    return r.slice(0, headers.length).map(c => sanitizeInput(c, 250));
  });

  return {
    fileName,
    sheetName: 'Sheet1',
    headers,
    rows,
    totalRows: rows.length,
  };
}

/**
 * Parses HTML <table> elements or SpreadsheetML XML tables
 */
function parseHtmlOrXmlTable(content: string, fileName: string): ParsedJobSpreadsheet {
  const rows: string[][] = [];

  // Browser / DOMParser path
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(content, 'text/html');
      const trs = Array.from(doc.querySelectorAll('tr'));
      for (const tr of trs) {
        const cells = Array.from(tr.querySelectorAll('th, td')).map(td => td.textContent?.trim() || '');
        if (cells.some(c => c.length > 0)) {
          rows.push(cells);
        }
      }
    } catch {
      // Fall back to regex below
    }
  }

  // Regex fallback for non-DOM / test environments
  if (rows.length === 0) {
    const trRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch: RegExpExecArray | null;
    while ((trMatch = trRegex.exec(content)) !== null) {
      const cellRegex = /<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      let cellMatch: RegExpExecArray | null;
      const rowCells: string[] = [];
      while ((cellMatch = cellRegex.exec(trMatch[1])) !== null) {
        const text = cellMatch[1].replace(/<[^>]+>/g, '').trim();
        rowCells.push(text);
      }
      if (rowCells.some(c => c.length > 0)) {
        rows.push(rowCells);
      }
    }
  }

  if (rows.length === 0) {
    throw new Error('No HTML or XML table rows found.');
  }

  const headers = rows[0].map(h => sanitizeInput(h, 100));
  const dataRows = rows.slice(1).map(r => {
    while (r.length < headers.length) r.push('');
    return r.slice(0, headers.length).map(c => sanitizeInput(c, 250));
  });

  return {
    fileName,
    sheetName: 'Exported Data',
    headers,
    rows: dataRows,
    totalRows: dataRows.length,
  };
}

/**
 * Delimited Text Parser (CSV / TSV)
 */
function parseDelimitedText(text: string, fileName: string, delimiter: string = ','): ParsedJobSpreadsheet {
  const rawLines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (rawLines.length === 0) {
    throw new Error('File is empty.');
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(rawLines[0]).map(h => sanitizeInput(h.replace(/^"|"$/g, ''), 100));
  const rows = rawLines.slice(1).map(l => {
    const parsed = parseLine(l).map(c => sanitizeInput(c.replace(/^"|"$/g, ''), 250));
    while (parsed.length < headers.length) parsed.push('');
    return parsed.slice(0, headers.length);
  });

  return {
    fileName,
    sheetName: delimiter === '\t' ? 'TSV Data' : 'CSV Data',
    headers,
    rows,
    totalRows: rows.length,
  };
}

async function parseCsvFile(file: File): Promise<ParsedJobSpreadsheet> {
  const text = await file.text();
  return parseDelimitedText(text, file.name, ',');
}

function formatCellValue(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    if (val.text) return String(val.text).trim();
    if (val.result !== undefined) return String(val.result).trim();
    if (val instanceof Date) return val.toISOString().split('T')[0];
    return String(val);
  }
  return String(val).trim();
}
