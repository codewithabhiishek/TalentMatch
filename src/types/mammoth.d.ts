declare module 'mammoth' {
  export interface MammothResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface ExtractOptions {
    arrayBuffer?: ArrayBuffer;
    buffer?: Buffer;
  }

  export function extractRawText(input: ExtractOptions): Promise<MammothResult>;
  export function convertToHtml(input: ExtractOptions): Promise<MammothResult>;
}
