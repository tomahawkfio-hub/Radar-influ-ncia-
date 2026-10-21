import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HistoryChart } from "@/components/site/HistoryChart";
import { Delta, DemoBadge, EmptyState, ErrorState, PersonAvatar, PlatformTag, Stat } from "@/components/site/bits";
import { PERIODS, countryName, flag, fmtDate, fmtInt, fmtPct, periodDays } from "@/lib/format";
import { absoluteGain, engagementRate, findComparable, growthPct } from "@/lib/metrics";
import { historyQuery, personQuery } from "@/lib/queries";

export const Route = createFileRoute("/perfil/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Perfil ${params.slug} — Radar de Influência` },
      { name: "description", content: "Métricas, fontes e evolução histórica do perfil." },
      { property: "og:title", content: `Perfil — Radar de Influência` },
      { property: "og:description", content: "Métricas com fonte e data e evolução histórica." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { slug } = Route.useParams();
  const [period, setPeriod] = useState("90d");
  const [acc, setAcc] = useState<string | null>(null);
  const p = useQuery(personQuery(slug));
  const accounts = p.data?.social_accounts ?? [];
  const current = accounts.find((a) => a.id === acc) ?? accounts[0];
  const days = periodDays(period);
  const h = useQuery(historyQuery(current ? [current.id] : [], days));

  if (p.error) return <div className="mx-auto max-w-6xl px-4 py-10"><ErrorState error={p.error} /></div>;
  if (p.isLoading) return <div className="mx-auto max-w-6xl px-4 py-10 text-muted-foreground">Carregando…</div>;
  if (!p.data) return <div className="mx-auto max-w-6xl px-4 py-10"><EmptyState title="Perfil não encontrado" /></div>;
  const d = p.data;
  const pts = h.data ?? [];
  const last = pts.at(-1);
  const prev = last ? findComparable(pts.map((x) => ({ t: x.captured_at, followers: x.followers })), new Date(last.captured_at), days) : null;
  const eng = last ? (last.engagement_rate ?? engagementRate(last.avg_likes, last.avg_comments, last.followers)) : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-4">
        <PersonAvatar name={d.name} url={d.avatar_url} size={72} />
        <div>
          <h1 className="text-3xl font-bold">{d.name}</h1>
          <p className="text-sm text-muted-foreground">
            {flag(d.country_code)} {countryName(d.country_code)} · {d.person_categories.map((c) => c.categories?.name).join(", ")}
            {d.party && ` · ${d.party}`}{d.political_office && ` · ${d.political_office}`}
          </p>
          {d.is_demo && <DemoBadge long className="mt-2" />}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {accounts.map((a) => (
          <button key={a.id} onClick={() => setAcc(a.id)} aria-pressed={current?.id === a.id} className={`rounded-lg border px-3 py-1.5 text-sm ${current?.id === a.id ? "border-primary bg-primary-soft" : "bg-card"}`}>
            <PlatformTag platform={a.platform} /> @{a.handle}
          </button>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Seguidores" value={fmtInt(last?.followers)} hint={last ? `${last.data_sources?.name ?? "—"} · ${fmtDate(last.captured_at)}` : "não disponível"} />
        <Stat label={`Ganho (${period})`} value={<Delta value={absoluteGain(prev?.followers, last?.followers)} />} />
        <Stat label="Crescimento" value={<Delta value={growthPct(prev?.followers, last?.followers)} kind="pct" />} />
        <Stat label="Engajamento" value={eng == null ? "—" : fmtPct(eng, false)} hint={eng == null ? "não disponível" : "por seguidores"} />
      </div>
      <section className="card-slim mt-6 p-4">
        <div className="mb-3 flex flex-wrap gap-1">
          {PERIODS.map((x) => (
            <button key={x.id} onClick={() => setPeriod(x.id)} aria-pressed={period === x.id} className={`rounded-md px-2.5 py-1 text-xs ${period === x.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{x.label}</button>
          ))}
        </div>
        <HistoryChart series={[{ key: "f", label: "Seguidores", points: pts.map((x) => ({ t: x.captured_at, v: x.followers })) }]} />
      </section>
      <Link to="/comparar" search={{ p: slug }} className="mt-6 inline-block text-sm text-primary hover:underline">Comparar com outros perfis →</Link>
    </div>
  );
}