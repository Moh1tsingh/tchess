import { parseNdjson } from "./ndjson.js";
import type {
  AccountEvent,
  GameStreamEvent,
  SeekParams,
} from "./events.js";

const LICHESS_BASE = "https://lichess.org";

export class LichessError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "LichessError";
  }
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function ensureOk(res: Response, context: string): Promise<void> {
  if (res.ok) return;
  let body = "";
  try {
    body = await res.text();
  } catch {
    // ignore
  }
  throw new LichessError(
    res.status,
    `${context} failed: ${res.status} ${res.statusText} ${body}`.trim(),
  );
}

async function* streamBody(
  body: ReadableStream<Uint8Array> | null,
): AsyncIterable<Uint8Array> {
  if (!body) return;
  const reader = body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      if (value) yield value;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }
}

export async function* streamEvents(
  token: string,
  signal: AbortSignal,
): AsyncGenerator<AccountEvent> {
  const res = await fetch(`${LICHESS_BASE}/api/stream/event`, {
    headers: authHeaders(token),
    signal,
  });
  await ensureOk(res, "streamEvents");
  for await (const event of parseNdjson<AccountEvent>(streamBody(res.body))) {
    yield event;
  }
}

export async function* streamGame(
  token: string,
  gameId: string,
  signal: AbortSignal,
): AsyncGenerator<GameStreamEvent> {
  const res = await fetch(
    `${LICHESS_BASE}/api/board/game/stream/${gameId}`,
    {
      headers: authHeaders(token),
      signal,
    },
  );
  await ensureOk(res, "streamGame");
  for await (const event of parseNdjson<GameStreamEvent>(
    streamBody(res.body),
  )) {
    yield event;
  }
}

export async function createSeek(
  token: string,
  params: SeekParams,
  signal: AbortSignal,
): Promise<void> {
  const body = new URLSearchParams();
  body.set("time", String(params.time));
  body.set("increment", String(params.increment));
  body.set("rated", String(params.rated));
  if (params.variant) body.set("variant", params.variant);
  if (params.color) body.set("color", params.color);
  if (params.ratingRange) body.set("ratingRange", params.ratingRange);

  const res = await fetch(`${LICHESS_BASE}/api/board/seek`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    signal,
  });

  // The endpoint streams keep-alive data until matched (or until the user
  // aborts). Drain but discard.
  if (!res.ok) await ensureOk(res, "createSeek");
  for await (const _ of streamBody(res.body)) {
    // swallow; match arrives via the events stream
  }
}

export async function submitMove(
  token: string,
  gameId: string,
  uci: string,
): Promise<void> {
  const res = await fetch(
    `${LICHESS_BASE}/api/board/game/${gameId}/move/${uci}`,
    { method: "POST", headers: authHeaders(token) },
  );
  await ensureOk(res, "submitMove");
}

export async function resign(
  token: string,
  gameId: string,
): Promise<void> {
  const res = await fetch(
    `${LICHESS_BASE}/api/board/game/${gameId}/resign`,
    { method: "POST", headers: authHeaders(token) },
  );
  await ensureOk(res, "resign");
}

export async function offerDraw(
  token: string,
  gameId: string,
  accept: boolean,
): Promise<void> {
  const res = await fetch(
    `${LICHESS_BASE}/api/board/game/${gameId}/draw/${accept ? "yes" : "no"}`,
    { method: "POST", headers: authHeaders(token) },
  );
  await ensureOk(res, "offerDraw");
}

export async function getAccount(
  token: string,
): Promise<{ id: string; username: string } | null> {
  const res = await fetch(`${LICHESS_BASE}/api/account`, {
    headers: authHeaders(token),
  });
  if (res.status === 401) return null;
  await ensureOk(res, "getAccount");
  return (await res.json()) as { id: string; username: string };
}
