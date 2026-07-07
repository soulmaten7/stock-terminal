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
};

const INDEX_SYMBOLS = [
  { symbol: "^KS11", name: "KOSPI" },
  { symbol: "^KQ11", name: "KOSDAQ" },
  { symbol: "^N225", name: "Nikkei 225" },
  { symbol: "USDKRW=X", name: "USD/KRW" },
  { symbol: "JPY=X", name: "USD/JPY" },
  { symbol: "^HSI", name: "Hang Seng" },
  { symbol: "000300.SS", name: "CSI 300" },
  { symbol: "CNY=X", name: "USD/CNY" },
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^SOX", name: "SOX" },
  { symbol: "^VIX", name: "VIX" },
  { symbol: "GC=F", name: "Gold" },
  { symbol: "BTC-USD", name: "Bitcoin" },
];

// 베트남 지수 — 야후 미커버(^VNINDEX 등 값 없음) → VnDirect dchart(공개 EOD OHLC)로 대체.
const VN_INDICES = [
  { symbol: "VNINDEX", name: "VN-Index" },
  { symbol: "VN30", name: "VN30" },
];

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
    // 야후 지수(quote+chart)와 베트남 지수(VnDirect)를 병렬로
    const [yahooItems, vnRaw] = await Promise.all([
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
          };
        })
      ),
      Promise.all(VN_INDICES.map(fetchVnIndex)),
    ]);

    // 베트남 지수를 아시아 블록(USD/CNY) 뒤에 삽입
    const vnItems = vnRaw.filter((x): x is IndexItem => x !== null);
    const cnyIdx = yahooItems.findIndex((x) => x.name === "USD/CNY");
    const merged =
      cnyIdx >= 0
        ? [...yahooItems.slice(0, cnyIdx + 1), ...vnItems, ...yahooItems.slice(cnyIdx + 1)]
        : [...yahooItems, ...vnItems];

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
