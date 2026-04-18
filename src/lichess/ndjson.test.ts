import { describe, expect, it } from "vitest";
import { parseNdjson } from "./ndjson.js";

async function* chunks(...parts: string[]): AsyncIterable<Uint8Array> {
  const enc = new TextEncoder();
  for (const p of parts) yield enc.encode(p);
}

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const v of iter) out.push(v);
  return out;
}

describe("parseNdjson", () => {
  it("parses one object per line", async () => {
    const result = await collect(
      parseNdjson(chunks(`{"a":1}\n{"b":2}\n`)),
    );
    expect(result).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("skips empty lines (heartbeats)", async () => {
    const result = await collect(
      parseNdjson(chunks(`\n{"a":1}\n\n\n{"b":2}\n\n`)),
    );
    expect(result).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("joins partial lines across chunks", async () => {
    const result = await collect(
      parseNdjson(chunks(`{"a":`, `1}\n{"b":2}`, `\n{"c":`, `3}\n`)),
    );
    expect(result).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it("emits trailing line without final newline", async () => {
    const result = await collect(parseNdjson(chunks(`{"a":1}\n{"b":2}`)));
    expect(result).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it("handles utf-8 multibyte split across chunks", async () => {
    // "♞" is 3 bytes in UTF-8: 0xE2 0x99 0x9E
    const full = `{"p":"♞"}\n`;
    const bytes = new TextEncoder().encode(full);
    const mid = Math.floor(bytes.length / 2);
    async function* split(): AsyncIterable<Uint8Array> {
      yield bytes.slice(0, mid);
      yield bytes.slice(mid);
    }
    const result = await collect(parseNdjson(split()));
    expect(result).toEqual([{ p: "♞" }]);
  });

  it("throws on malformed JSON", async () => {
    await expect(
      collect(parseNdjson(chunks(`{"a":1}\nnot-json\n`))),
    ).rejects.toThrow();
  });
});
