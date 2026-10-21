import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  } catch (err) {
    console.warn('PDF.js worker initialization warning:', err);
  }
}

/**
 * Extracts plain text from an uploaded PDF file
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
      const pageStrings = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .filter(Boolean);

      fullText += pageStrings.join(' ') + '\n\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Failed to parse PDF document:', error);
    // Fallback: try reading as text in case it's a formatted text stream
    try {
      const rawText = await file.text();
      // Filter out non-printable binary characters
      const cleanText = rawText.replace(/[^\x20-\x7E\t\n\r]/g, ' ').replace(/\s+/g, ' ');
      if (cleanText.length > 50) return cleanText;
    } catch {}
    throw new Error('Could not extract text from PDF document. Please verify the file is not password-protected.');
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
  } catch (error) {
    console.error('Failed to parse Word document:', error);
    throw new Error('Could not extract text from Word document. Please ensure it is a valid .docx file.');
  }
}

/**
 * Universal document text extractor supporting PDF, DOCX, and TXT
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

  throw new Error(`Unsupported file format: .${ext}. Please upload a PDF (.pdf) or Word document (.docx).`);
}
