import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DartItem = {
  corp: string;
  title: string;
  cls: string;
  stockCode: string;
  filer: string;
  date: string;
  rcpNo: string;
  link: string;
};

let cache: { at: number; data: unknown } | null = null;

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
const CLS: Record<string, string> = { Y: "코스피", K: "코스닥", N: "코넥스", E: "기타" };

export async function GET() {
  const key = (process.env.DART_API_KEY || "").trim();
  if (!key) return NextResponse.json({ items: [], error: "no_key" });

  if (cache && Date.now() - cache.at < 10 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }

  try {
    const now = new Date();
    const end = ymd(now);
    const begin = ymd(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000));
    const url =
      `https://opendart.fss.or.kr/api/list.json?crtfc_key=${key}` +
      `&bgn_de=${begin}&end_de=${end}&page_no=1&page_count=100&sort=date&sort_mth=desc`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ items: [], error: "dart_" + res.status });
    const j = await res.json();
    if (j.status !== "000") return NextResponse.json({ items: [], error: "dart_" + j.status });

    const items: DartItem[] = ((j.list ?? []) as Record<string, string>[])
      .filter((r) => (r.stock_code || "").trim())
      .slice(0, 20)
      .map((r) => {
        const rcpNo = (r.rcept_no || "").trim();
        return {
          corp: (r.corp_name || "").trim(),
          title: (r.report_nm || "").trim(),
          cls: CLS[r.corp_cls] || "",
          stockCode: (r.stock_code || "").trim(),
          filer: (r.flr_nm || "").trim(),
          date: (r.rcept_dt || "").trim(),
          rcpNo,
          link: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${rcpNo}`,
        };
      });

    const data = { items };
    cache = { at: Date.now(), data };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) });
  }
}
