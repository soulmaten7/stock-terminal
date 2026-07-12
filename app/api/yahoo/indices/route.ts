import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 30초 서버 캐시 — 그리드 + 하단 티커가 같은 데이터 공유, Yahoo 호출 절감
let _cache: { data: unknown; at: number } | null = null;
const _TTL = 30_000;

type IndexItem = {
  name: string;
  value: string;
  changeText: string;
  changePct: number;
  isUp: boolean;
  spark: number[];
  group: string;
};

const INDEX_SYMBOLS = [
  // 🇰🇷 KR
  { symbol: "^KS11", name: "KOSPI", group: "KR" },
  { symbol: "^KQ11", name: "KOSDAQ", group: "KR" },
  // 🇯🇵 JP — TOPIX(^TPX)는 야후가 깨진 값을 줘서 제외(아래 fetchTopix() 별도 처리).
  { symbol: "^N225", name: "Nikkei 225", group: "JP" },
  // 🇨🇳 CN + 🇭🇰 HK
  { symbol: "000001.SS", name: "SSE Composite", group: "CN" },
  { symbol: "000300.SS", name: "CSI 300", group: "CN" },
  { symbol: "^HSI", name: "Hang Seng", group: "CN" },
  // 🇺🇸 US
  { symbol: "^DJI", name: "Dow Jones", group: "US" },
  { symbol: "^IXIC", name: "NASDAQ", group: "US" },
  { symbol: "^GSPC", name: "S&P 500", group: "US" },
  { symbol: "^SOX", name: "SOX", group: "US" },
  // 🇬🇧 GB
  { symbol: "^FTSE", name: "FTSE 100", group: "GB" },
  { symbol: "^FTMC", name: "FTSE 250", group: "GB" },
  // 🌐 시장·환율·원자재
  { symbol: "^VIX", name: "VIX", group: "ETC" },
  { symbol: "USDKRW=X", name: "USD/KRW", group: "ETC" },
  { symbol: "JPY=X", name: "USD/JPY", group: "ETC" },
  { symbol: "CNY=X", name: "USD/CNY", group: "ETC" },
  { symbol: "GBP=X", name: "USD/GBP", group: "ETC" },
  { symbol: "GC=F", name: "Gold", group: "ETC" },
  { symbol: "BTC-USD", name: "Bitcoin", group: "ETC" },
];

// 베트남 지수 — 야후 미커버(^VNINDEX 등 값 없음) → VnDirect dchart(공개 EOD OHLC)로 대체.
const VN_INDICES = [
  { symbol: "VNINDEX", name: "VN-Index" },
  { symbol: "VN30", name: "VN30" },
];

// TOPIX — 야후 ^TPX는 quote가 105.18 같은 깨진 값(실제 TOPIX는 ~1000~5000대)에 spark도 빈값.
// 대체 심볼(^TOPX·998405.T) 순서대로 시도 — 실측: 둘 다 실패(undefined·상장폐지). 정상 범위 값이 나오는 심볼이 없으면
// 카드를 아예 제외(깨진 값을 그대로 노출하지 않음 — STEP 702 §1 원칙).
const TOPIX_CANDIDATES = ["^TOPX", "998405.T"];
async function fetchTopix(): Promise<IndexItem | null> {
  for (const symbol of TOPIX_CANDIDATES) {
    try {
      const q = await yf.quote(symbol, {}, { validateResult: false });
      const price = Number(q?.regularMarketPrice ?? 0);
      if (!(price >= 1000 && price <= 5000)) continue; // 정상 범위 아니면 다음 후보
      let spark: number[] = [];
      try {
        const ch = (await yf.chart(
          symbol,
          { period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), interval: "1d" },
          { validateResult: false }
        )) as { quotes?: { close?: number | null }[] };
        spark = (ch.quotes ?? []).map((c) => c.close).filter((n): n is number => typeof n === "number");
      } catch {
        spark = [];
      }
      if (spark.length === 0) continue; // 빈 spark면 다음 후보(깨진 카드 방지)
      const changePct = Number(q?.regularMarketChangePercent ?? 0);
      const change = Number(q?.regularMarketChange ?? 0);
      return {
        name: "TOPIX",
        value: price.toLocaleString("en-US", { maximumFractionDigits: 2 }),
        changeText: change.toLocaleString("en-US", { maximumFractionDigits: 2, signDisplay: "always" }),
        changePct,
        isUp: changePct >= 0,
        spark,
        group: "JP",
      };
    } catch {
      /* 다음 후보 */
    }
  }
  return null; // 전 후보 실패 — 카드 미표시(니케이만 뜸)
}

async function fetchVnIndex(meta: { symbol: string; name: string }): Promise<IndexItem | null> {
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - 45 * 24 * 60 * 60;
    const r = await fetch(
      `https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol=${meta.symbol}&from=${from}&to=${to}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { c?: number[] };
    const closes = (j.c ?? []).filter((n): n is number => typeof n === "number" && n > 0);
    if (closes.length < 2) return null;
    const last = closes[closes.length - 1];
    const prev = closes[closes.length - 2];
    const change = last - prev;
    const changePct = prev ? (change / prev) * 100 : 0;
    return {
      name: meta.name,
      value: last.toLocaleString("en-US", { maximumFractionDigits: 2 }),
      changeText: change.toLocaleString("en-US", { maximumFractionDigits: 2, signDisplay: "always" }),
      changePct,
      isUp: changePct >= 0,
      spark: closes.slice(-30),
      group: "VN",
    };
  } catch {
    return null;
  }
}

export async function GET() {
  if (_cache && Date.now() - _cache.at < _TTL) {
    return NextResponse.json(_cache.data);
  }
  try {
    // 야후 지수(quote+chart)·TOPIX 대체 심볼·베트남 지수(VnDirect)를 병렬로
    const [yahooItems, topix, vnRaw] = await Promise.all([
      Promise.all(
        INDEX_SYMBOLS.map(async (meta): Promise<IndexItem> => {
          const q = await yf.quote(meta.symbol);
          const price = Number(q.regularMarketPrice ?? 0);
          const changePct = Number(q.regularMarketChangePercent ?? 0);
          const change = Number(q.regularMarketChange ?? 0);

          // 스파크라인: 최근 약 30일 일봉 종가 배열 (실패해도 카드는 그대로 표시)
          let spark: number[] = [];
          try {
            const ch = await yf.chart(meta.symbol, {
              period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              interval: "1d",
            });
            spark = ch.quotes
              .map((c) => c.close)
              .filter((n): n is number => typeof n === "number");
          } catch {
            spark = [];
          }

          return {
            name: meta.name,
            value: price.toLocaleString("en-US", { maximumFractionDigits: 2 }),
            changeText: change.toLocaleString("en-US", { maximumFractionDigits: 2, signDisplay: "always" }),
            changePct,
            isUp: changePct >= 0,
            spark,
            group: meta.group,
          };
        })
      ),
      fetchTopix(),
      Promise.all(VN_INDICES.map(fetchVnIndex)),
    ]);

    // TOPIX(정상값 나온 경우만)를 니케이 바로 뒤에 삽입
    const lastJp = yahooItems.map((x) => x.group).lastIndexOf("JP");
    const withTopix =
      topix && lastJp >= 0
        ? [...yahooItems.slice(0, lastJp + 1), topix, ...yahooItems.slice(lastJp + 1)]
        : yahooItems;

    // VN 블록을 마지막 CN(=Hang Seng) 뒤에 삽입 → KR→JP→CN→VN→US→GB→ETC 순서
    const vnItems = vnRaw.filter((x): x is IndexItem => x !== null);
    const lastCn = withTopix.map((x) => x.group).lastIndexOf("CN");
    const merged =
      lastCn >= 0
        ? [...withTopix.slice(0, lastCn + 1), ...vnItems, ...withTopix.slice(lastCn + 1)]
        : [...withTopix, ...vnItems];

    const payload = { items: merged.filter((x) => x.value !== "0") };
    _cache = { data: payload, at: Date.now() };
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json(
      { items: [], error: e instanceof Error ? e.message : String(e) },
      { status: 200 }
    );
  }
}
