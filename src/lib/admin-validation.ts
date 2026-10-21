import { z } from "zod";

/** CSV RFC-4180 básico: aspas, vírgulas, CRLF e linhas com quebra dentro de aspas. */
export function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  const input = text.replace(/^\uFEFF/, "");
  let row: string[] = [], cell = "", quoted = false, afterQuote = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = false; afterQuote = true; }
      else cell += c;
    } else if (c === '"' && !cell && !afterQuote) {
      quoted = true;
    } else if (c === ",") {
      row.push(cell.trim()); cell = ""; afterQuote = false;
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && input[i + 1] === "\n") i++;
      row.push(cell.trim()); cell = ""; afterQuote = false;
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else if (afterQuote && (c === " " || c === "\t")) {
      // whitespace after a closing quote
    } else if (afterQuote) {
      throw new Error("CSV inválido: caracteres após aspas.");
    } else {
      if (c === '"') throw new Error("CSV inválido: aspas fora do campo.");
      cell += c;
    }
  }
  if (quoted) throw new Error("CSV inválido: aspas não fechadas.");
  row.push(cell.trim());
  if (row.some((v) => v !== "")) rows.push(row);
  return rows;
}

const optionalCount = z.number().int().nonnegative().nullable();
const optionalAverage = z.number().nonnegative().nullable();
const snapshotSchema = z.object({
  account_id: z.string().uuid(),
  captured_at: z.string().datetime({ offset: true }),
  followers: optionalCount,
  following: optionalCount,
  posts: optionalCount,
  total_views: optionalCount,
  avg_likes: optionalAverage,
  avg_comments: optionalAverage,
  engagement_rate: z.number().min(0).max(100).nullable(),
  is_estimate: z.boolean(),
  approved: z.boolean(),
});
export type ParsedSnapshot = z.infer<typeof snapshotSchema>;
const columns = ["account_id", "captured_at", "followers", "following", "posts", "total_views", "avg_likes", "avg_comments", "engagement_rate", "is_estimate", "approved"] as const;

function numberOrNull(value: string | undefined): number | null {
  if (!value || !value.trim()) return null;
  // The CSV format is explicit: use plain numbers, with "." as decimal separator.
  if (!/^\d+(?:\.\d+)?$/.test(value.trim())) throw new Error("Número inválido: " + value);
  const n = Number(value);
  if (!Number.isSafeInteger(n) && /^\d+$/.test(value.trim())) throw new Error("Inteiro fora do intervalo seguro");
  if (!Number.isFinite(n)) throw new Error("Número inválido");
  return n;
}
function flag(value: string | undefined, fallback: boolean) {
  if (!value || !value.trim()) return fallback;
  if (/^(true|1|sim)$/i.test(value.trim())) return true;
  if (/^(false|0|não|nao)$/i.test(value.trim())) return false;
  throw new Error("Booleano inválido: " + value);
}

export function parseSnapshotCsv(text: string): ParsedSnapshot[] {
  if (text.length > 1_500_000) throw new Error("CSV muito grande (limite 1,5 MB).");
  const rows = csvRows(text);
  if (rows.length < 2) throw new Error("O arquivo deve conter cabeçalho e pelo menos um registro.");
  if (rows.length > 501) throw new Error("Limite de 500 registros por importação.");
  const header = rows[0].map((s) => s.toLowerCase().trim());
  if (new Set(header).size !== header.length) throw new Error("Cabeçalhos duplicados.");
  for (const h of ["account_id", "captured_at", "followers"]) if (!header.includes(h)) throw new Error("Cabeçalho obrigatório ausente: " + h);
  if (header.some((h) => !columns.includes(h as typeof columns[number]))) throw new Error("Cabeçalho desconhecido.");
  return rows.slice(1).map((row, i) => {
    if (row.length !== header.length) throw new Error("Linha " + (i + 2) + ": colunas inconsistentes.");
    const get = (name: string) => row[header.indexOf(name)];
    try {
      const date = new Date(get("captured_at") || "");
      if (Number.isNaN(date.getTime())) throw new Error("Data inválida");
      if (date.getTime() > Date.now() + 10 * 60_000) throw new Error("Data futura não permitida");
      return snapshotSchema.parse({
        account_id: get("account_id"),
        captured_at: date.toISOString(),
        followers: numberOrNull(get("followers")),
        following: numberOrNull(get("following")),
        posts: numberOrNull(get("posts")),
        total_views: numberOrNull(get("total_views")),
        avg_likes: numberOrNull(get("avg_likes")),
        avg_comments: numberOrNull(get("avg_comments")),
        engagement_rate: numberOrNull(get("engagement_rate")),
        is_estimate: flag(get("is_estimate"), false),
        approved: flag(get("approved"), false),
      });
    } catch (error) {
      throw new Error("Linha " + (i + 2) + ": " + (error instanceof Error ? error.message : "inválida"));
    }
  });
}

export const personInput = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().regex(/^[a-z0-9-]{2,80}$/),
  country_code: z.string().regex(/^[A-Z]{2}$/),
  party: z.string().trim().max(100).nullable(),
  political_office: z.string().trim().max(100).nullable(),
  bio: z.string().trim().max(600).nullable(),
  avatar_url: z.union([z.string().url(), z.literal("")]).nullable(),
  status: z.enum(["draft", "approved", "archived"]),
  is_demo: z.boolean(),
});
export const accountInput = z.object({
  person_id: z.string().uuid(),
  platform: z.enum(["instagram", "tiktok", "youtube", "facebook", "x"]),
  handle: z.string().regex(/^[A-Za-z0-9._-]{1,60}$/),
  url: z.union([z.string().url(), z.literal("")]).nullable(),
  external_id: z.string().max(100).nullable(),
  status: z.enum(["draft", "approved", "archived"]),
});
