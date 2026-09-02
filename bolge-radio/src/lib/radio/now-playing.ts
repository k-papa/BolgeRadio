import { createServerFn } from "@tanstack/react-start";

export type TrackInfo = {
  title: string;
  artist: string | null;
};

export function formatTrack(track: TrackInfo): string {
  const title = repairMojibake(track.title);
  const artist = track.artist ? repairMojibake(track.artist) : null;
  if (artist) return `${artist} — ${title}`;
  return title;
}

export const getStreamTrack = createServerFn({ method: "POST" })
  .validator((input: { url: string }) => {
    const url = String(input?.url ?? "").trim();
    if (!isPublicHttpUrl(url)) throw new Error("Ugyldig stream-adresse");
    return { url };
  })
  .handler(async ({ data }): Promise<TrackInfo | null> => {
    const ctrl = AbortSignal.timeout(9000);
    const fromApi = await fetchKnownApi(data.url, ctrl);
    if (fromApi) return fromApi;
    return fetchIcyTitle(data.url, ctrl);
  });

function isPublicHttpUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host.endsWith(".localhost") ||
    host.endsWith(".internal") ||
    host.endsWith(".local")
  ) {
    return false;
  }
  if (
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.")
  ) {
    return false;
  }
  const m = /^172\.(\d+)\./.exec(host);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return false;
  return true;
}

async function fetchKnownApi(
  streamUrl: string,
  signal: AbortSignal,
): Promise<TrackInfo | null> {
  try {
    const url = new URL(streamUrl);
    const host = url.hostname.replace(/^www\./, "");
    const path = url.pathname.toLowerCase();

    if (host.endsWith("radioparadise.com")) {
      return parseParadise(
        await getJson("https://api.radioparadise.com/api/now_playing", signal),
      );
    }

    if (host.includes("somafm.com")) {
      const id =
        path.split("/").filter(Boolean)[0]?.replace(/-\d+-mp3$/i, "") ?? "";
      if (id) {
        return parseSoma(
          await getJson(`https://somafm.com/songs/${id}.json`, signal),
        );
      }
    }

    if (host.includes("radiofrance.fr") && path.includes("fip")) {
      return parseFip(
        await getJson("https://api.radiofrance.fr/livemeta/pull/7", signal),
      );
    }
  } catch {
    return null;
  }
  return null;
}

async function fetchIcyTitle(
  streamUrl: string,
  signal: AbortSignal,
): Promise<TrackInfo | null> {
  try {
    const res = await fetch(streamUrl, {
      headers: { "Icy-MetaData": "1" },
      signal,
      redirect: "follow",
    });
    if (!res.ok || !res.body) return null;
    const metaint = Number(res.headers.get("icy-metaint"));
    const target =
      Number.isFinite(metaint) && metaint > 0
        ? Math.min(metaint + 4096, 96_000)
        : 24_000;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    while (received < target) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      received += value.length;
    }
    await reader.cancel();
    const buf = concat(chunks);
    const title = extractIcyTitle(buf, Number(res.headers.get("icy-metaint")));
    if (!title) return null;
    return parseStreamTitle(title);
  } catch {
    return null;
  }
}

function extractIcyTitle(buf: Uint8Array, metaint: number): string | null {
  if (Number.isFinite(metaint) && metaint > 0 && buf.length > metaint) {
    const size = (buf[metaint] ?? 0) * 16;
    if (size > 0) {
      const block = buf.subarray(metaint + 1, Math.min(buf.length, metaint + 1 + size));
      const fromBlock = matchStreamTitle(decodeIcyBytes(block));
      if (fromBlock) return fromBlock;
    }
  }
  return matchStreamTitle(decodeIcyBytes(buf));
}

function matchStreamTitle(text: string): string | null {
  const cleaned = text.replace(/\0/g, "");
  const match =
    /StreamTitle='([^']*)'/.exec(cleaned) ?? /StreamTitle="([^"]*)"/.exec(cleaned);
  const raw = match?.[1];
  return raw ? repairMojibake(raw) : null;
}

function decodeIcyBytes(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    try {
      return new TextDecoder("windows-1252").decode(bytes);
    } catch {
      return new TextDecoder("latin1").decode(bytes);
    }
  }
}

/** Undo UTF-8 that was read as Latin-1 (mÃ¥ske → måske). */
export function repairMojibake(value: string): string {
  let current = value;
  for (let i = 0; i < 2; i++) {
    if (!/[ÃÂ]/.test(current)) break;
    const bytes = new Uint8Array(current.length);
    for (let j = 0; j < current.length; j++) {
      bytes[j] = current.charCodeAt(j) & 0xff;
    }
    try {
      const next = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (next === current) break;
      current = next;
    } catch {
      break;
    }
  }
  return current;
}

function parseStreamTitle(raw: string): TrackInfo | null {
  let value = decodeEntities(repairMojibake(raw))
    .replace(/^\/\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!value) return null;
  const parts = value.split(/\s[-–—]\s/);
  if (parts.length >= 2) {
    const artist = parts[0]?.trim() ?? "";
    const title = parts.slice(1).join(" — ").trim();
    if (artist && title) return { artist, title };
  }
  return { artist: null, title: value };
}

function parseParadise(data: unknown): TrackInfo | null {
  if (!data || typeof data !== "object") return null;
  const rec = data as { artist?: unknown; title?: unknown };
  const title = str(rec.title);
  if (!title) return null;
  return { title, artist: str(rec.artist) };
}

function parseSoma(data: unknown): TrackInfo | null {
  if (!data || typeof data !== "object") return null;
  const songs = (data as { songs?: unknown }).songs;
  if (!Array.isArray(songs) || songs.length === 0) return null;
  const first = songs[0] as { title?: unknown; artist?: unknown };
  const title = str(first.title);
  if (!title) return null;
  return { title, artist: str(first.artist) };
}

function parseFip(data: unknown): TrackInfo | null {
  if (!data || typeof data !== "object") return null;
  const steps = (data as { steps?: Record<string, unknown> }).steps;
  if (!steps) return null;
  const now = Date.now() / 1000;
  let current: Record<string, unknown> | null = null;
  for (const step of Object.values(steps)) {
    if (!step || typeof step !== "object") continue;
    const rec = step as Record<string, unknown>;
    const start = num(rec.start);
    const end = num(rec.end);
    if (start == null || end == null) continue;
    if (now >= start && now < end) {
      current = rec;
      break;
    }
  }
  if (!current) return null;
  const title = str(current.title);
  if (!title) return null;
  const highlighted = current.highlightedArtists;
  const artist = Array.isArray(highlighted)
    ? str(highlighted[0])
    : str(current.authors);
  return { title, artist };
}

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("meta");
  return res.json();
}

function str(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = decodeEntities(repairMojibake(value)).replace(/\s+/g, " ").trim();
  return trimmed ? trimmed : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  aelig: "æ",
  AElig: "Æ",
  oslash: "ø",
  Oslash: "Ø",
  aring: "å",
  Aring: "Å",
  eacute: "é",
  Eacute: "É",
  ouml: "ö",
  Ouml: "Ö",
  auml: "ä",
  Auml: "Ä",
  uuml: "ü",
  Uuml: "Ü",
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (full, ent: string) => {
    if (ent[0] === "#") {
      const code =
        ent[1] === "x" || ent[1] === "X"
          ? Number.parseInt(ent.slice(2), 16)
          : Number.parseInt(ent.slice(1), 10);
      if (Number.isFinite(code) && code >= 0) {
        try {
          return String.fromCodePoint(code);
        } catch {
          return full;
        }
      }
      return full;
    }
    return HTML_ENTITIES[ent] ?? full;
  });
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}
