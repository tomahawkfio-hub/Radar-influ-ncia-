import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RankingParams = {
  region?: "br" | "world" | undefined;
  country?: string | undefined;
  category?: string | undefined;
  platform?: string | undefined;
  periodDays: number;
  sort: string;
  q?: string | undefined;
  party?: string | undefined;
  office?: string | undefined;
  limit: number;
  offset: number;
};

export type RankingRow = {
  person_id: string;
  slug: string;
  name: string;
  avatar_url: string | null;
  country_code: string;
  party: string | null;
  political_office: string | null;
  is_demo: boolean;
  account_id: string;
  platform: string;
  handle: string;
  followers: number | null;
  followers_prev: number | null;
  gain: number | null;
  growth_pct: number | null;
  engagement_rate: number | null;
  captured_at: string | null;
  prev_captured_at: string | null;
  source_name: string | null;
  is_estimate: boolean | null;
  total_count: number;
};

export const rankingQuery = (p: RankingParams) =>
  queryOptions({
    queryKey: ["ranking", p],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_ranking", {
        p_region: p.region ?? "world",
        ...(p.country ? { p_country: p.country } : {}),
        ...(p.category ? { p_category: p.category } : {}),
        ...(p.platform ? { p_platform: p.platform } : {}),
        p_period_days: p.periodDays,
        p_sort: p.sort,
        ...(p.q?.trim() ? { p_search: p.q?.trim() } : {}),
        ...(p.party ? { p_party: p.party } : {}),
        ...(p.office ? { p_office: p.office } : {}),
        p_limit: p.limit,
        p_offset: p.offset,
      });
      if (error) throw error;
      return (data ?? []) as unknown as RankingRow[];
    },
    staleTime: 60_000,
  });

export const countriesQuery = () =>
  queryOptions({
    queryKey: ["countries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("people").select("country_code").limit(1000);
      if (error) throw error;
      return [...new Set((data ?? []).map((r) => r.country_code))].sort();
    },
    staleTime: 300_000,
  });

export const partiesQuery = () =>
  queryOptions({
    queryKey: ["parties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("people").select("party").not("party", "is", null).limit(1000);
      if (error) throw error;
      return [...new Set((data ?? []).map((r) => r.party as string))].sort();
    },
    staleTime: 300_000,
  });

export const personQuery = (slug: string) =>
  queryOptions({
    queryKey: ["person", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("people")
        .select(
          "id, slug, name, avatar_url, country_code, party, political_office, bio, is_demo, updated_at, person_categories(categories(slug,name)), social_accounts(id, platform, handle, url)",
        )
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export type Snapshot = {
  account_id: string;
  captured_at: string;
  followers: number | null;
  posts: number | null;
  avg_likes: number | null;
  avg_comments: number | null;
  engagement_rate: number | null;
  is_estimate: boolean;
  data_sources: { name: string; kind: string } | null;
};

/** Paginates past the 1000-row API cap so long periods stay complete. */
export const historyQuery = (accountIds: string[], days: number) =>
  queryOptions({
    queryKey: ["history", accountIds, days],
    enabled: accountIds.length > 0,
    queryFn: async () => {
      const since = new Date(Date.now() - (days + 2) * 86400000).toISOString();
      const out: Snapshot[] = [];
      for (let from = 0; from < 20000; from += 1000) {
        const { data, error } = await supabase
          .from("metric_snapshots")
          .select("account_id, captured_at, followers, posts, avg_likes, avg_comments, engagement_rate, is_estimate, data_sources(name, kind)")
          .in("account_id", accountIds)
          .gte("captured_at", since)
          .order("captured_at", { ascending: true })
          .range(from, from + 999);
        if (error) throw error;
        out.push(...((data ?? []) as unknown as Snapshot[]));
        if (!data || data.length < 1000) break;
      }
      return out;
    },
  });

export const searchPeopleQuery = (q: string) =>
  queryOptions({
    queryKey: ["search", q],
    enabled: q.trim().length >= 2,
    queryFn: async () => {
      const term = q.trim().replace(/[%,()]/g, "");
      const { data, error } = await supabase
        .from("people")
        .select("id, slug, name, avatar_url, country_code, is_demo, social_accounts(id, platform, handle)")
        .ilike("name", `%${term}%`)
        .order("name")
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });