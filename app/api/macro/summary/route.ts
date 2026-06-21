import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Indicator = {
  country: "KR" | "US";
  label: string;
  value: string;
  unit: string;
  date: string | null;
  change: number | null;
};

let cache: { at: number; data: unknown } | null = null;

const ECOS_KEYSTAT = "https://ecos.bok.or.kr/api/KeyStatisticList";
const KR_KEYWORDS = ["기준금리", "국고채(3년)", "원/달러", "소비자물가지수", "코스피"];

const FRED = "https://api.stlouisfed.org/fred/series/observations";
const US_SERIES: { id: string; label: string; unit: string }[] = [
  { id: "FEDFUNDS", label: "미국 기준금리", unit: "%" },
  { id: "DGS10", label: "미국 10년물 국채", unit: "%" },
  { id: "UNRATE", label: "미국 실업률", unit: "%" },
  { id: "CPIAUCSL", label: "미국 CPI", unit: "지수" },
];

function numfmt(s: string): string {
  const n = Number(String(s).replace(/,/g, ""));
  if (!Number.isFinite(n)) return String(s ?? "");
  return n.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

async function krIndicators(key: string): Promise<{ indicators?: Indicator[]; rawNames?: string[] }> {
  const u = `${ECOS_KEYSTAT}/${key}/json/kr/1/100`;
  const r = await fetch(u, { cache: "no-store", signal: AbortSignal.timeout(6000) });
  const j = await r.json();
  const rows = (j?.KeyStatisticList?.row ?? []) as Record<string, string>[];
  const rawNames = rows.map((x) => (x.KEYSTAT_NAME || "").trim());
  const out: Indicator[] = [];
  for (const kw of KR_KEYWORDS) {
    const row = rows.find((x) => (x.KEYSTAT_NAME || "").includes(kw));
    if (row) {
      out.push({
        country: "KR",
        label: (row.KEYSTAT_NAME || "").trim(),
        value: numfmt(row.DATA_VALUE || ""),
        unit: (row.UNIT_NAME || "").trim(),
        date: (row.CYCLE || row.TIME || "").trim() || null,
        change: null,
      });
    }
  }
  return { indicators: out, rawNames };
}

async function usIndicators(key: string): Promise<Indicator[]> {
  const out: Indicator[] = [];
  await Promise.all(
    US_SERIES.map(async (s) => {
      try {
        const p = new URLSearchParams({
          series_id: s.id, api_key: key, file_type: "json", sort_order: "desc", limit: "2",
        });
        const r = await fetch(`${FRED}?${p}`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
        const j = await r.json();
        const obs = (j.observations || []).filter((o: { value: string }) => o.value !== ".");
        const latest = obs[0], prev = obs[1];
        if (latest) {
          out.push({
            country: "US",
            label: s.label,
            value: numfmt(latest.value),
            unit: s.unit,
            date: latest.date || null,
            change: prev ? +(Number(latest.value) - Number(prev.value)).toFixed(2) : null,
          });
        }
      } catch { /* skip */ }
    })
  );
  return out.sort(
    (a, b) => US_SERIES.findIndex((s) => s.label === a.label) - US_SERIES.findIndex((s) => s.label === b.label)
  );
}

export async function GET(req: Request) {
  const ecosKey = (process.env.ECOS_API_KEY || "").trim();
  const fredKey = (process.env.FRED_API_KEY || "").trim();
  const debug = new URL(req.url).searchParams.get("debug") === "1";

  if (!debug && cache && Date.now() - cache.at < 30 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  const [kr, us] = await Promise.all([
    ecosKey ? krIndicators(ecosKey).catch(() => ({ indicators: [], rawNames: [] })) : Promise.resolve({ indicators: [], rawNames: [] }),
    fredKey ? usIndicators(fredKey).catch(() => []) : Promise.resolve([]),
  ]);

  if (debug) {
    return NextResponse.json({ krRaw: kr.rawNames ?? [], krPicked: kr.indicators ?? [], us });
  }

  const data = { kr: kr.indicators ?? [], us };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
