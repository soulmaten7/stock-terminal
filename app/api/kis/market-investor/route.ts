import { NextResponse } from "next/server";
import { fetchKisApi } from "@/lib/kis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 국내 시장별 투자자매매동향(일별) — KIS FHPTJ04040000. 코스피·코스닥 개인/외국인/기관 순매수.
// 검증된 엔드포인트(실측). 일별(장 마감 기준), output[0]=최신 영업일.

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
// 만원 → 억(반올림)
function eok(v: unknown): number {
  const n = Number(String(v ?? "").replace(/,/g, "")) || 0;
  return Math.round(n / 10000);
}

async function marketFlow(iscd: string, iscd1: string) {
  const today = new Date();
  const data = await fetchKisApi({
    endpoint: "/uapi/domestic-stock/v1/quotations/inquire-investor-daily-by-market",
    trId: "FHPTJ04040000",
    params: {
      FID_COND_MRKT_DIV_CODE: "U",
      FID_INPUT_ISCD: iscd,
      FID_INPUT_ISCD_1: iscd1,
      FID_INPUT_ISCD_2: iscd,
      FID_INPUT_DATE_1: ymd(today),
      FID_INPUT_DATE_2: ymd(today),
    },
    cacheTtlMs: 300_000, // 일별 데이터 → 5분 캐시
  });
  const row = (data.output ?? [])[0];
  if (!row) return null;
  return {
    date: String(row.stck_bsop_date ?? ""),
    indiv: eok(row.prsn_ntby_tr_pbmn),
    foreign: eok(row.frgn_ntby_tr_pbmn),
    inst: eok(row.orgn_ntby_tr_pbmn),
  };
}

export async function GET() {
  try {
    const [kospi, kosdaq] = await Promise.all([
      marketFlow("0001", "KSP").catch(() => null),
      marketFlow("1001", "KSQ").catch(() => null),
    ]);
    return NextResponse.json({ 코스피: kospi, 코스닥: kosdaq });
  } catch (e) {
    return NextResponse.json({
      코스피: null,
      코스닥: null,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
