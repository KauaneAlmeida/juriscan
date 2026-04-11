/**
 * Document text extraction utilities
 * Supports PDF, DOCX, DOC, and TXT files
 *
 * Uses `unpdf` for PDF extraction — designed for serverless (Vercel, etc.)
 * and handles all browser polyfills internally.
 */

// PDF extraction using unpdf (serverless-compatible, no browser deps)
export async function extractTextFromPDF(
  buffer: Buffer
): Promise<{ text: string; totalPages: number }> {
  try {
    const { extractText } = await import("unpdf");

    const result = await extractText(new Uint8Array(buffer), {
      mergePages: true,
    });

    const text = (result.text || "").trim();

    return {
      text,
      totalPages: result.totalPages || 1,
    };
  } catch (error) {
    console.error("[extractor] PDF extraction error:", error);
    throw new Error(
      `Falha ao extrair texto do PDF: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// DOCX extraction using mammoth
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    console.error("[extractor] DOCX extraction error:", error);
    throw new Error("Falha ao extrair texto do DOCX");
  }
}

// Extract text from a File object (reads the buffer internally)
export async function extractTextFromFile(
  file: File
): Promise<{ text: string; pageCount?: number }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return extractTextFromBuffer(buffer, file.type);
}

// Extract text from a pre-read Buffer (avoids re-reading consumed File streams)
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<{ text: string; pageCount?: number }> {
  // Plain text
  if (mimeType === "text/plain") {
    return { text: buffer.toString("utf-8") };
  }

  // PDF
  if (mimeType === "application/pdf") {
    const { text, totalPages } = await extractTextFromPDF(buffer);
    return { text, pageCount: totalPages };
  }

  // DOCX
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const text = await extractTextFromDocx(buffer);
    return { text };
  }

  // Unsupported type
  return { text: "" };
}

// Limit text to a maximum length while keeping it meaningful
export function truncateText(text: string, maxLength: number = 50000): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Try to truncate at a sentence boundary
  const truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastNewline = truncated.lastIndexOf("\n");
  const cutPoint = Math.max(lastPeriod, lastNewline, maxLength - 500);

  return truncated.substring(0, cutPoint + 1) + "\n\n[...texto truncado...]";
}
