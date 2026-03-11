/**
 * Split text into chunks of at most `size` characters.
 * Splits on newline boundaries to keep lines whole,
 * falling back to hard slicing for very long single lines.
 */
export function chunkText(text: string, size = 400): string[] {
  const chunks: string[] = [];
  const lines = text.split("\n");
  let current = "";

  for (const line of lines) {
    const joined = current ? current + "\n" + line : line;
    if (joined.length > size && current.length > 0) {
      chunks.push(current.trim());
      current = line;
    } else {
      current = joined;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // Hard-slice any chunk that still exceeds the size limit
  const result: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= size) {
      result.push(chunk);
    } else {
      for (let i = 0; i < chunk.length; i += size) {
        const slice = chunk.slice(i, i + size).trim();
        if (slice) result.push(slice);
      }
    }
  }

  return result.filter((c) => c.length > 0);
}
