import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ShortItem = {
  code: string;
  name: string;
  ratio: number;
  delta: number;
  signal: "숏커버" | "위험증가" | "안정";
};

// Layer 1-A2 에서 KRX 일일 CSV 다운로드 자동화로 교체 예정
const SHORT_INTEREST_SEED: ShortItem[] = [
  { code: "035720", name: "카카오",       ratio: 4.5, delta: -0.8, signal: "숏커버"  },
  { code: "005930", name: "삼성전자",     ratio: 1.2, delta: -0.3, signal: "숏커버"  },
  { code: "000660", name: "SK하이닉스",   ratio: 2.8, delta:  0.5, signal: "위험증가" },
  { code: "247540", name: "에코프로비엠", ratio: 3.1, delta:  0.7, signal: "위험증가" },
  { code: "035420", name: "NAVER",        ratio: 1.8, delta: -0.2, signal: "안정"    },
];

export async function GET() {
  return NextResponse.json({
    items: SHORT_INTEREST_SEED,
    source: "seed",
  });
}
