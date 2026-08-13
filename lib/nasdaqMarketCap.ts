// STEP 1013 — 나스닥 스크리너 marketCap 라이브 취득.
// 🔴 좌표 = lib/revdcf/registry.ts:91-100(STEP939/940이 이미 확정) — 새 엔드포인트 발명 안 함, 재사용만.
// 🔴 833 원칙: 원본 총건수·적재건수·marketCap 빈 건수를 각각 센다(classifyCaps와 같은 사상). 파싱 실패·형식 변경은
//   예외로 드러낸다 — 빈 배열을 "정상, 그냥 0건"으로 조용히 넘기지 않는다(응답 형식이 바뀌었을 수 있다는 신호이기 때문).
// 🔴 data/sources/nasdaq/*.json 스냅샷 파일은 읽지도 쓰지도 않는다(STEP1012가 확인한 "재취득 안 함" 스크립트와는 별개 경로).

const NASDAQ_URL = "https://api.nasdaq.com/api/screener/stocks?tableonly=false&limit=25000&download=true";
const UA = { "User-Agent": "Trillion Research admin@onetrillion.app", Accept: "application/json" };
const TIMEOUT_MS = 20_000;

export type NasdaqMarketCapRow = { symbol: string; marketCap: number | null };
export type NasdaqMarketCapResult = {
  totalRows: number; // 원본 응답의 행수(심볼 없는 행 포함)
  savedRows: number; // 심볼이 있어 적재 대상이 된 행수
  emptyCap: number; // marketCap이 없거나 파싱 불가한 행수(savedRows 중)
  rows: NasdaqMarketCapRow[];
};

function parseMarketCap(raw: unknown): number | null {
  if (typeof raw === "number") return raw > 0 ? raw : null;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

export async function fetchNasdaqMarketCap(): Promise<NasdaqMarketCapResult> {
  const r = await fetch(NASDAQ_URL, { headers: UA, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!r.ok) throw new Error(`나스닥 스크리너 HTTP_${r.status}`);
  const j = (await r.json()) as { data?: { rows?: unknown } };
  const rawRows = j?.data?.rows;
  if (!Array.isArray(rawRows)) throw new Error("나스닥 스크리너 응답 형식 변경(data.rows가 배열이 아님)");

  const totalRows = rawRows.length;
  let emptyCap = 0;
  const rows: NasdaqMarketCapRow[] = [];
  for (const raw of rawRows as Record<string, unknown>[]) {
    const symbol = typeof raw?.symbol === "string" ? raw.symbol : null;
    if (!symbol) continue; // 심볼 없는 행은 적재 불가 — totalRows에는 이미 반영됨
    const marketCap = parseMarketCap(raw.marketCap);
    if (marketCap == null) emptyCap++;
    rows.push({ symbol, marketCap });
  }
  return { totalRows, savedRows: rows.length, emptyCap, rows };
}
