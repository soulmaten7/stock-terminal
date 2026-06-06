import { NextResponse } from "next/server";
import { fetchKisApi } from "@/lib/kis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 업종별 등락 (KIS FHPUP02140000) — '지금 뜨는 카테고리'. 코스피 업종 38개.
function num(s: string | undefined): number {
  return Number(String(s ?? "").replace(/,/g, "")) || 0;
}

export async function GET() {
  try {
    const data = await fetchKisApi({
      endpoint: "/uapi/domestic-stock/v1/quotations/inquire-index-category-price",
      trId: "FHPUP02140000",
      params: {
        FID_COND_MRKT_DIV_CODE: "U",
        FID_INPUT_ISCD: "0001",
        FID_COND_SCR_DIV_CODE: "20214",
        FID_MRKT_CLS_CODE: "K",
        FID_BLNG_CLS_CODE: "0",
      },
      cacheTtlMs: 60_000,
    });
    const rows = (data.output2 ?? []) as Record<string, string>[];
    const sectors = rows
      .map((r) => ({
        code: String(r.bstp_cls_code ?? ""),
        name: String(r.hts_kor_isnm ?? "").trim(),
        index: num(r.bstp_nmix_prpr),
        changePercent: num(r.bstp_nmix_prdy_ctrt),
        tradeAmount: num(r.acml_tr_pbmn),
      }))
      .filter((s) => s.name && s.index > 0)
      .sort((a, b) => b.changePercent - a.changePercent);
    return NextResponse.json({ sectors });
  } catch (e) {
    return NextResponse.json({ sectors: [], error: e instanceof Error ? e.message : String(e) });
  }
}
