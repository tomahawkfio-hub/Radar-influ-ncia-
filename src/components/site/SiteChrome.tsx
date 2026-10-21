import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Radar de Influência — início">
      <span className="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-primary/30 bg-primary-soft">
        <span className="absolute inset-1 rounded-full border border-primary/25" />
        <span className="absolute inset-0 animate-sweep" style={{ background: "conic-gradient(from 0deg, transparent 0 300deg, var(--primary) 360deg)", opacity: 0.35 }} />
        <span className="relative h-1.5 w-1.5 rounded-full bg-primary" />
      </span>
      <span className="font-display text-[17px] font-semibold tracking-tight">
        Radar <span className="text-primary">de Influência</span>
      </span>
    </Link>
  );
}

const NAV = [
  { to: "/rankings", label: "Rankings" },
  { to: "/comparar", label: "Comparar" },
  { to: "/metodologia", label: "Metodologia" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-card focus:px-3 focus:py-2">
        Pular para o conteúdo
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Logo />
        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground font-medium" }}
            >
              {n.label}
            </Link>
          ))}
          <Link to="/admin" className="ml-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">Admin</Link>
        </nav>
        <button className="rounded-md p-2 md:hidden" aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav aria-label="Menu móvel" className="border-t px-4 py-2 md:hidden animate-fade-up">
          {[...NAV, { to: "/admin", label: "Admin" } as const].map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-md px-2 py-2.5 text-sm hover:bg-muted">
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted-foreground md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs">Ranking e evolução de contas públicas com fonte e data de cada número.</p>
        </div>
        <p className="md:col-span-2 md:text-right">
          Métricas vêm de snapshots registrados com fonte e data (UTC). Cobertura parcial; alguns valores são estimativas de provedores.{" "}
          <Link to="/metodologia" className="text-primary underline-offset-2 hover:underline">Ver metodologia</Link>.
        </p>
      </div>
    </footer>
  );
}