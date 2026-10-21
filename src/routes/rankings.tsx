import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { RankingList } from "@/components/site/RankingList";
import { EmptyState, ErrorState } from "@/components/site/bits";
import { CATEGORIES, PERIODS, PLATFORMS, SORTS, countryName, periodDays } from "@/lib/format";
import { countriesQuery, partiesQuery, rankingQuery } from "@/lib/queries";

const PAGE = 25;
const schema = z.object({
  region: z.enum(["br", "world"]).optional(),
  country: z.string().optional(),
  category: z.string().optional(),
  platform: z.string().optional(),
  period: z.string().optional(),
  sort: z.string().optional(),
  q: z.string().optional(),
  party: z.string().optional(),
  page: z.number().int().min(1).optional(),
});

export const Route = createFileRoute("/rankings")({
  validateSearch: schema,
  head: () => ({
    meta: [
      { title: "Rankings de redes sociais — Radar de Influência" },
      { name: "description", content: "Filtre por país, categoria, plataforma e período e ordene por seguidores, ganho, crescimento ou engajamento." },
      { property: "og:title", content: "Rankings — Radar de Influência" },
      { property: "og:description", content: "Tabela classificatória de contas públicas com filtros." },
    ],
  }),
  component: Rankings,
});

const sel = "h-9 rounded-lg border bg-card px-2 text-sm";

function Rankings() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/rankings" });
  const set = (patch: Partial<z.infer<typeof schema>>) => navigate({ search: (p) => ({ ...p, ...patch, page: undefined }) });
  const page = s.page ?? 1;
  const platform = s.platform ?? "instagram";
  const q = useQuery(rankingQuery({
    region: s.region, country: s.country, category: s.category, platform,
    periodDays: periodDays(s.period ?? "30d"), sort: s.sort ?? "followers", q: s.q, party: s.party,
    limit: PAGE, offset: (page - 1) * PAGE,
  }));
  const countries = useQuery(countriesQuery());
  const parties = useQuery(partiesQuery());
  const total = q.data?.[0]?.total_count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Rankings</h1>
      <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-8">
        <input aria-label="Buscar nome ou @" placeholder="Nome ou @" defaultValue={s.q} className={sel + " col-span-2"} onKeyDown={(e) => e.key === "Enter" && set({ q: e.currentTarget.value || undefined })} />
        <select aria-label="Região" className={sel} value={s.region ?? "world"} onChange={(e) => set({ region: e.target.value as "br" | "world" })}>
          <option value="world">Mundo</option><option value="br">Brasil</option>
        </select>
        <select aria-label="País" className={sel} value={s.country ?? ""} onChange={(e) => set({ country: e.target.value || undefined })}>
          <option value="">Todos os países</option>
          {countries.data?.map((c) => <option key={c} value={c}>{countryName(c)}</option>)}
        </select>
        <select aria-label="Categoria" className={sel} value={s.category ?? ""} onChange={(e) => set({ category: e.target.value || undefined })}>
          <option value="">Categorias</option>
          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
        </select>
        <select aria-label="Plataforma" className={sel} value={platform} onChange={(e) => set({ platform: e.target.value })}>
          {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <select aria-label="Período" className={sel} value={s.period ?? "30d"} onChange={(e) => set({ period: e.target.value })}>
          {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <select aria-label="Ordenar" className={sel} value={s.sort ?? "followers"} onChange={(e) => set({ sort: e.target.value })}>
          {SORTS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        {s.category === "politicos" && (
          <select aria-label="Partido" className={sel} value={s.party ?? ""} onChange={(e) => set({ party: e.target.value || undefined })}>
            <option value="">Todos os partidos</option>
            {parties.data?.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
      </div>
      <div className="mt-6">
        {q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} />
          : !q.isLoading && !q.data?.length ? <EmptyState title="Nenhuma conta encontrada">Ajuste os filtros ou a busca.</EmptyState>
          : <RankingList rows={q.data ?? []} loading={q.isLoading} offset={(page - 1) * PAGE} />}
      </div>
      {pages > 1 && (
        <nav aria-label="Paginação" className="mt-6 flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => navigate({ search: (p) => ({ ...p, page: page - 1 }) })} className="rounded-md border px-3 py-1.5 disabled:opacity-40">Anterior</button>
          <span className="tnum">{page} / {pages}</span>
          <button disabled={page >= pages} onClick={() => navigate({ search: (p) => ({ ...p, page: page + 1 }) })} className="rounded-md border px-3 py-1.5 disabled:opacity-40">Próxima</button>
        </nav>
      )}
    </div>
  );
}