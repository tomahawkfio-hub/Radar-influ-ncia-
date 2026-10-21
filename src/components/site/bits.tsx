import { ArrowDownRight, ArrowUpRight, FlaskConical, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtPct, fmtSigned, initials, platformLabel } from "@/lib/format";

export function DemoBadge({ className, long = false }: { className?: string; long?: boolean }) {
  return (
    <span
      title="Dados fictícios de demonstração"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-demo-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-demo",
        className,
      )}
    >
      <FlaskConical className="h-3 w-3" aria-hidden />
      {long ? "Dados fictícios de demonstração" : "Demo"}
    </span>
  );
}

export function Delta({ value, kind = "abs", className }: { value: number | null | undefined; kind?: "abs" | "pct"; className?: string }) {
  if (value == null)
    return <span className={cn("tnum text-muted-foreground", className)} title="Sem snapshot comparável no período">—</span>;
  const up = value > 0;
  const down = value < 0;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <span className={cn("tnum inline-flex items-center gap-0.5 font-medium", up && "text-success", down && "text-danger", !up && !down && "text-muted-foreground", className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {kind === "pct" ? fmtPct(value) : fmtSigned(value)}
    </span>
  );
}

export function PersonAvatar({ name, url, size = 40, className }: { name: string; url?: string | null; size?: number; className?: string }) {
  return url ? (
    <img src={url} alt="" width={size} height={size} loading="lazy" className={cn("shrink-0 rounded-full object-cover", className)} style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-display font-semibold text-primary", className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  );
}

const PLATFORM_DOT: Record<string, string> = {
  instagram: "bg-chart-1",
  tiktok: "bg-graphite",
  youtube: "bg-danger",
  facebook: "bg-chart-4",
  x: "bg-foreground",
};
export function PlatformTag({ platform, className }: { platform: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border bg-card px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", PLATFORM_DOT[platform] ?? "bg-muted-foreground")} aria-hidden />
      {platformLabel(platform)}
    </span>
  );
}

export function Stat({ label, value, hint, className }: { label: string; value: React.ReactNode; hint?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("card-slim p-4", className)}>
      <div className="eyebrow">{label}</div>
      <div className="tnum mt-1.5 font-display text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function EmptyState({ title, children, icon }: { title: string; children?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="card-slim flex flex-col items-center px-6 py-12 text-center">
      {icon}
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      {children && <div className="mt-1 max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft p-4 text-sm">
      <p className="font-medium text-danger">Não foi possível carregar os dados.</p>
      <p className="mt-1 text-muted-foreground">{error instanceof Error ? error.message : "Erro desconhecido."}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 rounded-md bg-card px-3 py-1.5 text-xs font-medium shadow-card hover:bg-muted">
          Tentar novamente
        </button>
      )}
    </div>
  );
}