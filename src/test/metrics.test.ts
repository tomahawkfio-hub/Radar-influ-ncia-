import { describe, expect, it } from "vitest";
import { absoluteGain, engagementRate, findComparable, growthPct } from "@/lib/metrics";

describe("metric formulas", () => {
  it("growth % uses the previous snapshot as base", () => {
    expect(growthPct(1000, 1100)).toBeCloseTo(10);
    expect(growthPct(1000, 900)).toBeCloseTo(-10);
  });
  it("growth % is unavailable without a positive base", () => {
    expect(growthPct(0, 100)).toBeNull();
    expect(growthPct(null, 100)).toBeNull();
  });
  it("absolute gain is current minus previous", () => {
    expect(absoluteGain(5000, 4200)).toBe(-800);
    expect(absoluteGain(undefined, 4200)).toBeNull();
  });
  it("engagement = (likes + comments) / followers × 100", () => {
    expect(engagementRate(900, 100, 50000)).toBeCloseTo(2);
    expect(engagementRate(900, 100, 0)).toBeNull();
  });
  it("only compares snapshots inside the tolerance window", () => {
    const ref = new Date("2026-10-20T00:00:00Z");
    const series = [
      { t: "2026-09-01T00:00:00Z", followers: 1 }, // 49 days: too old for 30d (max 38)
      { t: "2026-09-15T00:00:00Z", followers: 2 }, // 35 days: ok
      { t: "2026-10-10T00:00:00Z", followers: 3 }, // 10 days: too recent
    ];
    expect(findComparable(series, ref, 30)?.followers).toBe(2);
    expect(findComparable([series[0]!], ref, 30)).toBeNull();
  });
});