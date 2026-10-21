// Pure metric formulas. Documented on /metodologia — keep both in sync.

export type Point = { t: string | Date; followers: number | null };

/** Absolute follower gain between two comparable snapshots. */
export function absoluteGain(prev: number | null | undefined, curr: number | null | undefined) {
  if (prev == null || curr == null) return null;
  return curr - prev;
}

/** Growth % = (atual − anterior) / anterior × 100. Null when the base is missing or zero. */
export function growthPct(prev: number | null | undefined, curr: number | null | undefined) {
  if (prev == null || curr == null || prev <= 0) return null;
  return ((curr - prev) / prev) * 100;
}

/** Engagement rate by followers = (média curtidas + média comentários) / seguidores × 100. */
export function engagementRate(
  avgLikes: number | null | undefined,
  avgComments: number | null | undefined,
  followers: number | null | undefined,
) {
  if (avgLikes == null || followers == null || followers <= 0) return null;
  return ((avgLikes + (avgComments ?? 0)) / followers) * 100;
}

/**
 * Finds the latest snapshot at least `days` before `ref`, but not older than
 * days × 1.25 + 1 (tolerance window). Returns null when no comparable snapshot exists,
 * so gains are never computed from incomparable dates.
 */
export function findComparable(series: Point[], ref: Date, days: number) {
  const target = ref.getTime() - days * 86400000;
  const oldest = ref.getTime() - (Math.floor(days * 1.25) + 1) * 86400000;
  let best: Point | null = null;
  for (const p of series) {
    if (p.followers == null) continue;
    const t = new Date(p.t).getTime();
    if (t <= target && t >= oldest && (!best || t > new Date(best.t).getTime())) best = p;
  }
  return best;
}