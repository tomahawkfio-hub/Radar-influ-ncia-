import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/site/bits";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Radar de Influência" },
      { name: "description", content: "Área administrativa." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — Radar de Influência" },
      { property: "og:description", content: "Área administrativa." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <EmptyState title="Painel administrativo em construção">Login, cadastro de pessoas/contas, importação CSV e gestão de provedores serão adicionados na próxima etapa.</EmptyState>
    </div>
  ),
});