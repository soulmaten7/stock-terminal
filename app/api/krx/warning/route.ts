import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WarningItem = {
  code: string;
  name: string;
  type: "관리종목" | "투자유의" | "단기과열";
  reason: string;
  severity: "high" | "medium";
};

// Layer 1-A2 에서 KRX 일일 CSV 자동화로 교체 예정
const WARNING_SEED: WarningItem[] = [
  { code: "000000", name: "△△텔레콤",  type: "관리종목", reason: "영업적자 2년 연속",       severity: "high"   },
  { code: "000001", name: "○○에너지",  type: "투자유의", reason: "자본잠식 50% 초과",       severity: "high"   },
  { code: "000002", name: "××바이오",  type: "단기과열", reason: "거래량 급증 + 주가 급등",  severity: "medium" },
  { code: "000003", name: "□□건설",   type: "관리종목", reason: "감사보고서 의견거절",       severity: "high"   },
  { code: "000004", name: "▽▽전자",   type: "투자유의", reason: "관리종목 지정 우려",        severity: "medium" },
];

export async function GET() {
  return NextResponse.json({ items: WARNING_SEED, source: "seed" });
}
