import { describe, expect, it } from "vitest";
import { csvRows, parseSnapshotCsv, personInput, accountInput } from "@/lib/admin-validation";

const uuid = "00000000-0000-4000-8000-000000000001";
const row = ["account_id,captured_at,followers,is_estimate,approved", [uuid,"2026-01-01T00:00:00Z","1234","false","true"].join(",")].join("\n");
describe("admin CSV + validation", () => {
  it("parses imported snapshots with correct types", () => {
    const items = parseSnapshotCsv(row);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ account_id: uuid, followers: 1234, is_estimate: false, approved: true });
  });
  it("rejects rows missing required columns", () => {
    expect(() => parseSnapshotCsv("followers,captured_at\n1,2026-01-01T00:00:00Z")).toThrow("account_id");
  });
  it("rejects negative follower counts", () => {
    expect(() => parseSnapshotCsv(row.replace("1234", "-2"))).toThrow("Linha 2");
  });
  it("supports quoted delimiters", () => {
    expect(csvRows('a,b\n"x,y","z""q"')).toEqual([["a","b"],["x,y",'z"q']]);
  });
  it("rejects future timestamps", () => {
    const date = new Date(Date.now() + 86400000).toISOString();
    expect(() => parseSnapshotCsv(row.replace("2026-01-01T00:00:00Z", date))).toThrow("futura");
  });
  it("rejects unknown headers", () => {
    expect(() => parseSnapshotCsv(row.replace("followers", "followers,hacker"))).toThrow();
  });
  it("validates people and accounts", () => {
    expect(personInput.safeParse({ name:"A", slug:"x",country_code:"Brazil" }).success).toBe(false);
    expect(accountInput.safeParse({person_id:uuid,platform:"instagram",handle:"space name",status:"approved"}).success).toBe(false);
  });
});
