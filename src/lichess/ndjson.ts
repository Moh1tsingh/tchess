export async function* parseNdjson<T = unknown>(
  source: AsyncIterable<Uint8Array>,
): AsyncGenerator<T> {
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  for await (const chunk of source) {
    buffer += decoder.decode(chunk, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;
      yield JSON.parse(trimmed) as T;
    }
  }

  buffer += decoder.decode();
  const tail = buffer.trim();
  if (tail.length > 0) yield JSON.parse(tail) as T;
}
