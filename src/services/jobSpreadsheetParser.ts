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
 * Universal Spreadsheet Parser (Excel .xlsx, .xls, and .csv)
 * Reads client files in browser or Node with zero high-vulnerability deps.
 */
export async function parseJobSpreadsheet(file: File): Promise<ParsedJobSpreadsheet> {
  const fileName = file.name;
  const ext = fileName.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    return parseCsvFile(file);
  }

  // Handle .xlsx and .xls binary workbooks with exceljs
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('Spreadsheet has no readable sheets.');
  }

  const sheetName = worksheet.name || 'Sheet1';
  const headers: string[] = [];
  const rows: string[][] = [];

  // Find header row (first non-empty row)
  let headerRowIndex = 1;
  worksheet.eachRow((row, rowNumber) => {
    if (headers.length === 0) {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      const rowStrings = values.map(v => formatCellValue(v));
      if (rowStrings.some(s => s.length > 0)) {
        headers.push(...rowStrings.map(h => sanitizeInput(h, 100)));
        headerRowIndex = rowNumber;
      }
    } else if (rowNumber > headerRowIndex) {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      const rowStrings = values.map(v => formatCellValue(v));
      if (rowStrings.some(s => s.length > 0)) {
        // Pad to header length
        while (rowStrings.length < headers.length) rowStrings.push('');
        rows.push(rowStrings.slice(0, headers.length).map(c => sanitizeInput(c, 250)));
      }
    }
  });

  if (headers.length === 0) {
    throw new Error('Spreadsheet appears to be empty or has no header row.');
  }

  return {
    fileName,
    sheetName,
    headers,
    rows,
    totalRows: rows.length,
  };
}

async function parseCsvFile(file: File): Promise<ParsedJobSpreadsheet> {
  const text = await file.text();
  const rawLines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (rawLines.length === 0) {
    throw new Error('CSV file is empty.');
  }

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCsvLine(rawLines[0]).map(h => sanitizeInput(h.replace(/^"|"$/g, ''), 100));
  const rows = rawLines.slice(1).map(l => {
    const parsed = parseCsvLine(l).map(c => sanitizeInput(c.replace(/^"|"$/g, ''), 250));
    while (parsed.length < headers.length) parsed.push('');
    return parsed.slice(0, headers.length);
  });

  return {
    fileName: file.name,
    sheetName: 'CSV Data',
    headers,
    rows,
    totalRows: rows.length,
  };
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

