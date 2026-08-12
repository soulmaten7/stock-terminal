// STEP 1000 §3 — riskFree 조달원 스왑(x) 설계. f(assembleWacc 공식)는 그대로, x(값의 출처)만 교체 가능하게.
// 🔴 route.ts에 배선하지 않음 — 순수함수 + 별도 fetch함수만. 배선은 장은태 승인 후 별도 STEP.

export type RiskFreeSource = "damodaran" | "fred";

export interface RiskFreeResolution {
  value: number;
  source: RiskFreeSource;
  asOf: string | null;
}

/**
 * x 선택 — 계산식(f)은 건드리지 않는다. source='damodaran'이면 damodaranValue를 그대로 반환하므로
 * 기존 코드(route.ts 179-267행)와 값 불변(§3-4 증명 대상).
 */
export function resolveRiskFree(opts: {
  source: RiskFreeSource;
  damodaranValue: number;
  damodaranAsOf: string | null;
  fred?: { value: number; asOf: string } | null;
}): RiskFreeResolution {
  if (opts.source === "fred") {
    if (!opts.fred) throw new Error("resolveRiskFree: source=fred인데 fred 값이 없다");
    return { value: opts.fred.value, source: "fred", asOf: opts.fred.asOf };
  }
  return { value: opts.damodaranValue, source: "damodaran", asOf: opts.damodaranAsOf };
}

/**
 * FRED DGS10 무인증 CSV 경로(999·1000에서 실측 확인). 최신 값 1개만 필요하므로 최근 10일 range로
 * 요청해 마지막 non-"." 행을 취한다(주말·공휴일은 "." — 필터링 필요).
 * 🔴 이 함수는 어디서도 import되지 않는다(배선 없음) — 검증 스크립트에서만 호출.
 */
export async function fetchFredDGS10(): Promise<{ value: number; asOf: string } | null> {
  const today = new Date();
  const start = new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10&cosd=${fmt(start)}&coed=${fmt(today)}`;

  let text: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Trillion Research; admin@onetrillion.app)" },
    });
    if (!res.ok) return null;
    text = await res.text();
  } catch {
    return null;
  }

  const lines = text.trim().split("\n").slice(1); // header 제외
  for (let i = lines.length - 1; i >= 0; i--) {
    const [date, raw] = lines[i].split(",");
    if (!raw || raw.trim() === ".") continue;
    const v = Number(raw.trim());
    if (Number.isFinite(v)) return { value: v / 100, asOf: date.trim() };
  }
  return null;
}
