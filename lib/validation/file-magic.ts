// Magic bytes para validação de tipo real de arquivo
const MAGIC_BYTES: Record<string, number[][]> = {
  // PNG: 89 50 4E 47
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  // JPEG: FF D8 FF
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  // WebP: 52 49 46 46 ... 57 45 42 50
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
  // PDF: 25 50 44 46
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
  // DOCX/XLSX/PPTX (ZIP): 50 4B 03 04
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [[0x50, 0x4b, 0x03, 0x04]],
  // MP3: FF FB, FF F3, FF F2, ou ID3
  "audio/mpeg": [[0xff, 0xfb], [0xff, 0xf3], [0xff, 0xf2], [0x49, 0x44, 0x33]],
  // WAV: 52 49 46 46
  "audio/wav": [[0x52, 0x49, 0x46, 0x46]],
  // OGG: 4F 67 67 53
  "audio/ogg": [[0x4f, 0x67, 0x67, 0x53]],
  // MP4/M4A: ... 66 74 79 70 (at offset 4)
  "audio/mp4": [],
  "video/mp4": [],
  // WebM: 1A 45 DF A3
  "audio/webm": [[0x1a, 0x45, 0xdf, 0xa3]],
};

/**
 * Valida se os primeiros bytes do arquivo correspondem ao MIME type declarado.
 * Retorna true se o tipo é válido ou se não temos magic bytes para o tipo.
 */
export async function validateMagicBytes(file: File): Promise<boolean> {
  const signatures = MAGIC_BYTES[file.type];

  // Se não temos assinatura para este tipo, aceitar (fail open para tipos desconhecidos)
  if (!signatures || signatures.length === 0) {
    return true;
  }

  const buffer = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  return signatures.some((sig) =>
    sig.every((byte, i) => bytes[i] === byte)
  );
}
