import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { countryName, flag, fmtCompact, fmtDate, fmtInt, fmtPct, followerNoun } from "@/lib/format";
import type { RankingRow } from "@/lib/queries";
import { Delta, DemoBadge, PersonAvatar, PlatformTag } from "./bits";

export function RankingList({ rows, offset = 0, loading, compact = false }: { rows: RankingRow[]; offset?: number; loading?: boolean; compact?: boolean }) {
  if (loading)
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Carregando ranking">
        {Array.from({ length: compact ? 5 : 10 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );

  return (
    <>
      {/* Desktop table */}
      <div className={compact ? "hidden" : "card-slim hidden overflow-x-auto md:block"}>
        <table className="w-full text-sm">
          <caption className="sr-only">Ranking de contas</caption>
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th scope="col" className="w-12 px-4 py-3 font-medium">#</th>
              <th scope="col" className="px-2 py-3 font-medium">Perfil</th>
              <th scope="col" className="px-2 py-3 font-medium">País</th>
              <th scope="col" className="px-2 py-3 text-right font-medium">Seguidores</th>
              <th scope="col" className="px-2 py-3 text-right font-medium">Ganho</th>
              <th scope="col" className="px-2 py-3 text-right font-medium">Cresc. %</th>
              <th scope="col" className="px-2 py-3 text-right font-medium">Engaj.</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Atualizado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.account_id} className="border-b last:border-0 transition-colors hover:bg-muted/60">
                <td className="tnum px-4 py-2.5 text-muted-foreground">{offset + i + 1}</td>
                <td className="px-2 py-2.5">
                  <Link to="/perfil/$slug" params={{ slug: r.slug }} className="group flex items-center gap-3">
                    <PersonAvatar name={r.name} url={r.avatar_url} size={34} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 font-medium group-hover:text-primary">
                        <span className="truncate">{r.name}</span>
                        {r.is_demo && <DemoBadge />}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        @{r.handle} <PlatformTag platform={r.platform} />
                        {r.party && <span className="truncate">· {r.party}</span>}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-2 py-2.5 text-muted-foreground" title="Nacionalidade/origem declarada — não indica local da audiência">
                  {flag(r.country_code)} {countryName(r.country_code)}
                </td>
                <td className="tnum px-2 py-2.5 text-right font-semibold" title={fmtInt(r.followers)}>
                  {fmtCompact(r.followers)}
                  {r.is_estimate && <span className="ml-1 text-[10px] text-muted-foreground">est.</span>}
                </td>
                <td className="px-2 py-2.5 text-right"><Delta value={r.gain} /></td>
                <td className="px-2 py-2.5 text-right"><Delta value={r.growth_pct} kind="pct" /></td>
                <td className="tnum px-2 py-2.5 text-right">{r.engagement_rate == null ? <span className="text-muted-foreground">—</span> : fmtPct(r.engagement_rate, false)}</td>
                <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{fmtDate(r.captured_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile / compact list */}
      <ol className={compact ? "space-y-1.5" : "space-y-1.5 md:hidden"}>
        {rows.map((r, i) => (
          <li key={r.account_id}>
            <Link
              to="/perfil/$slug"
              params={{ slug: r.slug }}
              className="card-slim flex items-center gap-3 px-3 py-2.5 transition hover:shadow-lift"
            >
              <span className="tnum w-5 text-right text-xs text-muted-foreground">{offset + i + 1}</span>
              <PersonAvatar name={r.name} url={r.avatar_url} size={36} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <span className="truncate">{r.name}</span>
                  {r.is_demo && <DemoBadge />}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {flag(r.country_code)} @{r.handle} · {r.platform}
                </span>
              </span>
              <span className="text-right">
                <span className="tnum block text-sm font-semibold">{fmtCompact(r.followers)}</span>
                <span className="block text-xs"><Delta value={r.gain} /></span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {rows[0] && !compact && (
        <p className="mt-2 text-xs text-muted-foreground">
          Valores em {followerNoun(rows[0].platform)}. "—" = sem snapshot comparável no período.
        </p>
      )}
    </>
  );
}