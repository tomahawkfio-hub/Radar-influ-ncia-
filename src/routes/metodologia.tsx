import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/metodologia")({
  head: () => ({
    meta: [
      { title: "Metodologia — Radar de Influência" },
      { name: "description", content: "Fórmulas de crescimento e engajamento, fontes, estimativas e limites de cobertura." },
      { property: "og:title", content: "Metodologia — Radar de Influência" },
      { property: "og:description", content: "Como calculamos crescimento e engajamento." },
    ],
  }),
  component: () => (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-10 leading-relaxed">
      <h1 className="text-3xl font-bold">Metodologia</h1>
      <section><h2 className="text-xl font-semibold">Snapshots</h2><p>Cada número vem de um snapshot com data (UTC) e fonte. Não fazemos coleta em tempo real nem acessamos dados privados.</p></section>
      <section><h2 className="text-xl font-semibold">Crescimento</h2><p className="tnum font-mono text-sm">Ganho = seguidores(atual) − seguidores(anterior)<br />Crescimento % = Ganho ÷ seguidores(anterior) × 100</p><p>O snapshot anterior é o mais recente com pelo menos N dias antes do último, dentro de uma janela de tolerância de N × 1,25 + 1 dias. Sem snapshot comparável, mostramos "—".</p></section>
      <section><h2 className="text-xl font-semibold">Engajamento</h2><p className="tnum font-mono text-sm">Taxa = (média de curtidas + média de comentários) ÷ seguidores × 100</p><p>Quando o provedor fornece a taxa pronta, usamos o valor dele. Métricas de redes diferentes não são somadas nem comparadas diretamente.</p></section>
      <section><h2 className="text-xl font-semibold">Limites</h2><p>Cobertura parcial; valores marcados "est." são estimativas. O YouTube arredonda inscritos. País indica nacionalidade/origem, não local da audiência. Perfis marcados "Demo" são dados fictícios de demonstração.</p></section>
    </article>
  ),
});