import "server-only";

// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse.js";
import { AiError, classifyAiError } from "@/lib/ai/errors";

export const MAX_CV_BYTES = 5 * 1024 * 1024;
export const MAX_RESUME_TEXT_CHARS = 80_000;

export async function extractTextFromPdf(
  pdfBuffer: Buffer
): Promise<string> {
  if (pdfBuffer.byteLength > MAX_CV_BYTES) {
    throw new AiError(
      "RESUME_TOO_LARGE",
      "Uploaded CV exceeds the 5 MB limit."
    );
  }

  try {
    const result = await pdf(pdfBuffer);

    const text = result.text.trim();

    if (!text) {
      throw new AiError(
        "PDF_EXTRACTION",
        "No readable text found in PDF."
      );
    }

    if (text.length > MAX_RESUME_TEXT_CHARS) {
      throw new AiError(
        "RESUME_TOO_LARGE",
        "Extracted text exceeds supported size."
      );
    }

    return text;
  } catch (error) {
    if (error instanceof AiError) throw error;

    throw classifyAiError(error);
  }
}