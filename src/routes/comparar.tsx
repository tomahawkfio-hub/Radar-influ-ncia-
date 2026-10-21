import { useQueries, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { z } from "zod";
import { HistoryChart } from "@/components/site/HistoryChart";
import { PersonSearch } from "@/components/site/PersonSearch";
import { DemoBadge, EmptyState, PersonAvatar } from "@/components/site/bits";
import { PLATFORMS, fmtInt } from "@/lib/format";
import { historyQuery, personQuery } from "@/lib/queries";

export const Route = createFileRoute("/comparar")({
  validateSearch: z.object({ p: z.string().optional(), rede: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Comparar perfis — Radar de Influência" },
      { name: "description", content: "Compare de 2 a 4 perfis na mesma rede social, lado a lado." },
      { property: "og:title", content: "Comparar perfis — Radar de Influência" },
      { property: "og:description", content: "Comparação justa na mesma rede, com evolução histórica." },
    ],
  }),
  component: Compare,
});

function Compare() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/comparar" });
  const slugs = (s.p ?? "").split(",").filter(Boolean).slice(0, 4);
  const rede = s.rede ?? "instagram";
  const people = useQueries({ queries: slugs.map((sl) => personQuery(sl)) });
  const accs = people.map((q) => q.data?.social_accounts.find((a) => a.platform === rede));
  const ids = accs.filter(Boolean).map((a) => a!.id);
  const h = useQuery(historyQuery(ids, 90));
  const setSlugs = (l: string[]) => navigate({ search: (p) => ({ ...p, p: l.join(",") || undefined }) });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Comparar perfis</h1>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select aria-label="Rede social" value={rede} onChange={(e) => navigate({ search: (p) => ({ ...p, rede: e.target.value }) })} className="h-10 rounded-lg border bg-card px-2 text-sm">
          {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        {slugs.length < 4 && <PersonSearch className="w-full max-w-sm" placeholder="Adicionar perfil…" onPick={(p) => !slugs.includes(p.slug) && setSlugs([...slugs, p.slug])} />}
      </div>
      {slugs.length < 2 ? <div className="mt-6"><EmptyState title="Escolha de 2 a 4 perfis">A comparação usa a mesma rede social para todos.</EmptyState></div> : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {people.map((q, i) => {
              const d = q.data; const a = accs[i];
              const last = h.data?.filter((x) => x.account_id === a?.id).at(-1);
              return (
                <div key={slugs[i]} className="card-slim relative p-4">
                  <button aria-label="Remover" onClick={() => setSlugs(slugs.filter((x) => x !== slugs[i]))} className="absolute right-2 top-2 rounded p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
                  {d && <div className="flex items-center gap-2"><PersonAvatar name={d.name} size={36} /><div className="min-w-0"><div className="truncate font-medium">{d.name}</div>{d.is_demo && <DemoBadge />}</div></div>}
                  <div className="tnum mt-3 font-display text-2xl font-semibold">{a ? fmtInt(last?.followers) : "não disponível"}</div>
                  <div className="text-xs text-muted-foreground">{a ? `@${a.handle}` : "Sem conta nesta rede"}</div>
                </div>
              );
            })}
          </div>
          <div className="card-slim mt-6 p-4">
            <HistoryChart series={accs.map((a, i) => a ? { key: a.id, label: people[i]?.data?.name ?? "", points: (h.data ?? []).filter((x) => x.account_id === a.id).map((x) => ({ t: x.captured_at, v: x.followers })) } : null).filter((x): x is NonNullable<typeof x> => !!x)} />
          </div>
        </>
      )}
    </div>
  );
}