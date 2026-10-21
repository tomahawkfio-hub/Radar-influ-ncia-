import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PersonSearch } from "@/components/site/PersonSearch";
import { RankingList } from "@/components/site/RankingList";
import { DemoBadge, ErrorState } from "@/components/site/bits";
import { CATEGORIES } from "@/lib/format";
import { rankingQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Radar de Influência — ranking de redes sociais no Brasil e no mundo" },
      { name: "description", content: "Acompanhe, ranqueie e compare o crescimento de contas públicas no Instagram, TikTok, YouTube, Facebook e X." },
      { property: "og:title", content: "Radar de Influência" },
      { property: "og:description", content: "Ranking e evolução de contas públicas com fonte e data de cada número." },
    ],
  }),
  component: Home,
});

function Block({ title, sort, region }: { title: string; sort: string; region: "br" | "world" }) {
  const q = useQuery(rankingQuery({ region, platform: "instagram", periodDays: 30, sort, limit: 5, offset: 0 }));
  return (
    <section className="animate-fade-up">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Link to="/rankings" search={{ region, sort }} className="text-xs text-primary hover:underline">Ver tudo</Link>
      </div>
      {q.error ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : <RankingList rows={q.data ?? []} loading={q.isLoading} compact />}
    </section>
  );
}

function Home() {
  return (
    <div>
      <section className="radar-grid border-b">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <span className="eyebrow">Instagram · TikTok · YouTube · Facebook · X</span>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold md:text-6xl">Quem está crescendo — com fonte e data de cada número.</h1>
          <p className="mt-4 max-w-xl text-muted-foreground">Rankings, evolução histórica e comparações de contas públicas. Sem métricas inventadas.</p>
          <PersonSearch size="lg" className="mt-8 max-w-xl" />
          <div className="mt-4"><DemoBadge long /> <span className="ml-1 text-xs text-muted-foreground">Os perfis atuais são fictícios até a conexão de fontes reais.</span></div>
        </div>
      </section>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2">
        <Block title="Destaques Brasil" sort="followers" region="br" />
        <Block title="Destaques mundo" sort="followers" region="world" />
        <Block title="Maiores ganhos (30 dias)" sort="gain" region="world" />
        <Block title="Maiores perdas (30 dias)" sort="loss" region="world" />
      </div>
      <section className="mx-auto max-w-6xl px-4">
        <h2 className="mb-3 text-lg font-semibold">Categorias</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} to="/rankings" search={{ category: c.slug }} className="card-slim px-4 py-2 text-sm hover:shadow-lift">{c.label}</Link>
          ))}
        </div>
      </section>
    </div>
  );
}