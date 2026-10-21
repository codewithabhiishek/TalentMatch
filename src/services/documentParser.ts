import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure PDF.js worker with dual-strategy: local Vite worker asset with CDN fallback
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }
}

interface TextItemWithCoords {
  str: string;
  x: number;
  y: number;
  hasEOL?: boolean;
}

/**
 * Spatially reconstructs lines from PDF text items.
 * Sorts from top-to-bottom (PDF Y descending) and left-to-right (X ascending).
 * Preserves multi-column resume layouts without interleaving text.
 */
function reconstructPageText(items: any[]): string {
  const parsedItems: TextItemWithCoords[] = items
    .filter(item => 'str' in item && typeof item.str === 'string' && item.str.trim().length > 0)
    .map(item => ({
      str: item.str,
      x: Array.isArray(item.transform) ? item.transform[4] : 0,
      y: Array.isArray(item.transform) ? item.transform[5] : 0,
      hasEOL: item.hasEOL,
    }));

  if (parsedItems.length === 0) return '';

  // Sort top to bottom, then left to right
  parsedItems.sort((a, b) => {
    // Within 5 points vertical difference, treat as same line
    if (Math.abs(b.y - a.y) > 5) {
      return b.y - a.y; // Higher Y = higher on page in PDF coordinates
    }
    return a.x - b.x;
  });

  let result = '';
  let lastY = parsedItems[0].y;
  let lastX = parsedItems[0].x;

  for (const item of parsedItems) {
    const yDiff = Math.abs(lastY - item.y);
    if (yDiff > 12) {
      // Significant line drop -> new paragraph / double newline
      result += '\n\n';
    } else if (yDiff > 5 || item.hasEOL) {
      // Standard line drop
      result += '\n';
    } else if (item.x - lastX > 15) {
      // Horizontal separation on same line
      result += '   ';
    } else {
      result += ' ';
    }

    result += item.str.trim();
    lastY = item.y;
    lastX = item.x + (item.str.length * 6);
  }

  return result.trim();
}

/**
 * Extracts plain text from an uploaded PDF file with spatial line preservation
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = reconstructPageText(textContent.items);

      if (pageText) {
        fullText += pageText + '\n\n--- Page Break ---\n\n';
      }
    }

    const trimmed = fullText.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }

    throw new Error('PDF has no extractable text layers.');
  } catch (error: any) {
    console.warn('PDF.js spatial parsing warning, attempting standard stream fallback:', error.message);
    try {
      const rawText = await file.text();
      const cleanText = rawText.replace(/[^\x20-\x7E\t\n\r]/g, ' ').replace(/\s+/g, ' ');
      if (cleanText.length > 50) return cleanText;
    } catch {}
    throw new Error('Could not extract text from PDF document. Please verify the file contains selectable text and is not an encrypted scan.');
  }
}

/**
 * Extracts plain text from an uploaded Microsoft Word DOCX file
 */
export async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('DOCX document appears to be empty.');
    }
    return result.value.trim();
  } catch (error: any) {
    console.error('Failed to parse Word document:', error);
    throw new Error(`Could not extract text from Word document: ${error.message || 'Corrupt or unsupported format'}.`);
  }
}

/**
 * Universal document text extractor supporting PDF, DOCX, DOC, and TXT
 */
export async function extractDocumentText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') {
    return await extractTextFromPdf(file);
  }

  if (ext === 'docx' || ext === 'doc') {
    return await extractTextFromDocx(file);
  }

  if (ext === 'txt') {
    return (await file.text()).trim();
  }

  throw new Error(`Unsupported file format: .${ext}. Please upload a PDF (.pdf), Word document (.docx), or plain text (.txt).`);
}
