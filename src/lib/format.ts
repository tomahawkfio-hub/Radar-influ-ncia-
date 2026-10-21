export const PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "facebook", label: "Facebook" },
  { id: "x", label: "X" },
] as const;
export type PlatformId = (typeof PLATFORMS)[number]["id"];
export const platformLabel = (p: string) => PLATFORMS.find((x) => x.id === p)?.label ?? p;
export const followerNoun = (p: string) => (p === "youtube" ? "inscritos" : "seguidores");

export const CATEGORIES = [
  { slug: "politicos", label: "Políticos" },
  { slug: "influenciadores", label: "Influenciadores" },
  { slug: "celebridades", label: "Celebridades" },
  { slug: "jornalistas", label: "Jornalistas" },
  { slug: "atletas", label: "Atletas" },
  { slug: "musicos", label: "Músicos" },
  { slug: "criadores", label: "Criadores" },
] as const;

export const PERIODS = [
  { id: "24h", days: 1, label: "24h" },
  { id: "7d", days: 7, label: "7 dias" },
  { id: "30d", days: 30, label: "30 dias" },
  { id: "90d", days: 90, label: "90 dias" },
  { id: "1a", days: 365, label: "1 ano" },
] as const;
export type PeriodId = (typeof PERIODS)[number]["id"];
export const periodDays = (id: string) => PERIODS.find((p) => p.id === id)?.days ?? 30;
export const periodLabel = (id: string) => PERIODS.find((p) => p.id === id)?.label ?? id;

export const SORTS = [
  { id: "followers", label: "Seguidores" },
  { id: "gain", label: "Ganho absoluto" },
  { id: "growth", label: "Crescimento %" },
  { id: "engagement", label: "Engajamento" },
  { id: "loss", label: "Maior perda" },
] as const;

const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("pt-BR");

export const NA = "não disponível";

export function fmtCompact(n: number | null | undefined) {
  return n == null ? "—" : compact.format(n);
}
export function fmtInt(n: number | null | undefined) {
  return n == null ? "—" : integer.format(n);
}
export function fmtSigned(n: number | null | undefined, compactMode = true) {
  if (n == null) return "—";
  const s = compactMode ? compact.format(Math.abs(n)) : integer.format(Math.abs(n));
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${s}`;
}
export function fmtPct(n: number | null | undefined, signed = true, digits = 2) {
  if (n == null) return "—";
  const v = Math.abs(n).toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
  return `${signed ? (n > 0 ? "+" : n < 0 ? "−" : "") : ""}${v}%`;
}
export function fmtDate(d: string | null | undefined, withTime = false) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }) + (withTime ? " UTC" : "");
}

let regionNames: Intl.DisplayNames | null = null;
export function countryName(cc: string | null | undefined) {
  if (!cc) return "—";
  try {
    regionNames ??= new Intl.DisplayNames(["pt-BR"], { type: "region" });
    return regionNames.of(cc.toUpperCase()) ?? cc;
  } catch {
    return cc;
  }
}
export function flag(cc: string | null | undefined) {
  if (!cc || cc.length !== 2) return "";
  return String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)));
}
export function initials(name: string) {
  return name
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}