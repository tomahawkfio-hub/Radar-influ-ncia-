import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { flag } from "@/lib/format";
import { searchPeopleQuery } from "@/lib/queries";
import { DemoBadge, PersonAvatar } from "./bits";

function useDebounced<T>(v: T, ms = 250) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

/** Autocomplete search. `onPick` overrides default navigation to the profile. */
export function PersonSearch({
  size = "md",
  placeholder = "Buscar personalidade por nome…",
  onPick,
  className,
}: {
  size?: "md" | "lg";
  placeholder?: string;
  onPick?: (p: { slug: string; name: string }) => void;
  className?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const dq = useDebounced(q);
  const { data = [], isFetching } = useQuery(searchPeopleQuery(dq));
  const navigate = useNavigate();
  const listId = useId();

  const pick = (p: { slug: string; name: string }) => {
    setOpen(false);
    setQ("");
    if (onPick) onPick(p);
    else navigate({ to: "/perfil/$slug", params: { slug: p.slug } });
  };

  return (
    <div className={cn("relative", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (data[active] && open) pick(data[active]);
          else if (!onPick && q.trim()) navigate({ to: "/rankings", search: { q: q.trim() } });
        }}
      >
        <label className="sr-only" htmlFor={listId + "-in"}>Buscar personalidade</label>
        <Search className={cn("pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground", size === "lg" ? "h-5 w-5" : "h-4 w-4")} aria-hidden />
        <input
          id={listId + "-in"}
          role="combobox"
          aria-expanded={open && data.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={q}
          placeholder={placeholder}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, data.length - 1));
            if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
            if (e.key === "Escape") setOpen(false);
          }}
          className={cn(
            "w-full rounded-xl border bg-card pl-10 pr-4 shadow-card outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15",
            size === "lg" ? "h-14 text-base" : "h-10 text-sm",
          )}
        />
      </form>
      {open && dq.trim().length >= 2 && (
        <ul id={listId} role="listbox" className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border bg-popover shadow-lift animate-fade-up">
          {data.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">{isFetching ? "Buscando…" : "Nenhum perfil encontrado."}</li>
          )}
          {data.map((p, i) => (
            <li
              key={p.id}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(p);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn("flex cursor-pointer items-center gap-3 px-3 py-2", i === active && "bg-muted")}
            >
              <PersonAvatar name={p.name} url={p.avatar_url} size={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{p.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {flag(p.country_code)} {p.social_accounts.map((a) => "@" + a.handle).slice(0, 1).join(" ")}
                </span>
              </span>
              {p.is_demo && <DemoBadge />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}