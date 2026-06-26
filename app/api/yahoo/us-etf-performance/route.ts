import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 미국 대표 ETF (티커·영문 약식명). AUM/거래량 상위 + 국내개미 선호(인컴·레버리지/인버스 포함).
// 순수 Yahoo 심볼(접미사 없음). 주식 라우트(us-performance)와 동일 패턴, UNIVERSE만 ETF.
const UNIVERSE: { sym: string; name: string }[] = [
  // ── 광범위 지수 (브로드 마켓) ──
  { sym: "SPY", name: "SPDR S&P 500 (SPY)" },
  { sym: "VOO", name: "Vanguard S&P 500 (VOO)" },
  { sym: "IVV", name: "iShares S&P 500 (IVV)" },
  { sym: "VTI", name: "Vanguard Total Market (VTI)" },
  { sym: "QQQ", name: "Invesco NASDAQ 100 (QQQ)" },
  { sym: "QQQM", name: "Invesco NASDAQ 100 M (QQQM)" },
  { sym: "DIA", name: "SPDR Dow Jones (DIA)" },
  { sym: "IWM", name: "iShares Russell 2000 (IWM)" },
  { sym: "IJR", name: "iShares Core S&P Small-Cap (IJR)" },
  { sym: "IJH", name: "iShares Core S&P Mid-Cap (IJH)" },
  { sym: "MDY", name: "SPDR S&P MidCap 400 (MDY)" },
  { sym: "RSP", name: "Invesco S&P 500 Equal Weight (RSP)" },
  // ── 스타일 / 팩터 ──
  { sym: "VUG", name: "Vanguard Growth (VUG)" },
  { sym: "VTV", name: "Vanguard Value (VTV)" },
  { sym: "IWF", name: "iShares Russell 1000 Growth (IWF)" },
  { sym: "IWD", name: "iShares Russell 1000 Value (IWD)" },
  { sym: "SCHD", name: "Schwab US Dividend (SCHD)" },
  { sym: "VIG", name: "Vanguard Dividend Appreciation (VIG)" },
  { sym: "DGRO", name: "iShares Core Dividend Growth (DGRO)" },
  { sym: "VYM", name: "Vanguard High Dividend Yield (VYM)" },
  { sym: "MTUM", name: "iShares MSCI USA Momentum (MTUM)" },
  { sym: "QUAL", name: "iShares MSCI USA Quality (QUAL)" },
  // ── 섹터 (SPDR Select) ──
  { sym: "XLK", name: "Technology Sector (XLK)" },
  { sym: "XLF", name: "Financial Sector (XLF)" },
  { sym: "XLE", name: "Energy Sector (XLE)" },
  { sym: "XLV", name: "Health Care Sector (XLV)" },
  { sym: "XLY", name: "Consumer Discretionary (XLY)" },
  { sym: "XLP", name: "Consumer Staples (XLP)" },
  { sym: "XLI", name: "Industrial Sector (XLI)" },
  { sym: "XLU", name: "Utilities Sector (XLU)" },
  { sym: "XLB", name: "Materials Sector (XLB)" },
  { sym: "XLRE", name: "Real Estate Sector (XLRE)" },
  { sym: "XLC", name: "Communication Services (XLC)" },
  // ── 테크 / 반도체 / 테마 ──
  { sym: "SMH", name: "VanEck Semiconductor (SMH)" },
  { sym: "SOXX", name: "iShares Semiconductor (SOXX)" },
  { sym: "VGT", name: "Vanguard Information Tech (VGT)" },
  { sym: "IGV", name: "iShares Expanded Tech-Software (IGV)" },
  { sym: "ARKK", name: "ARK Innovation (ARKK)" },
  { sym: "IBIT", name: "iShares Bitcoin Trust (IBIT)" },
  { sym: "XBI", name: "SPDR S&P Biotech (XBI)" },
  // ── 해외 / 신흥국 ──
  { sym: "VEA", name: "Vanguard Developed Markets (VEA)" },
  { sym: "VWO", name: "Vanguard Emerging Markets (VWO)" },
  { sym: "EFA", name: "iShares MSCI EAFE (EFA)" },
  { sym: "EEM", name: "iShares MSCI Emerging (EEM)" },
  { sym: "IEFA", name: "iShares Core MSCI EAFE (IEFA)" },
  { sym: "IEMG", name: "iShares Core MSCI Emerging (IEMG)" },
  { sym: "VXUS", name: "Vanguard Total Intl Stock (VXUS)" },
  { sym: "INDA", name: "iShares MSCI India (INDA)" },
  { sym: "EWJ", name: "iShares MSCI Japan (EWJ)" },
  { sym: "MCHI", name: "iShares MSCI China (MCHI)" },
  { sym: "FXI", name: "iShares China Large-Cap (FXI)" },
  // ── 채권 ──
  { sym: "BND", name: "Vanguard Total Bond Market (BND)" },
  { sym: "AGG", name: "iShares Core US Aggregate Bond (AGG)" },
  { sym: "TLT", name: "iShares 20+ Year Treasury (TLT)" },
  { sym: "IEF", name: "iShares 7-10 Year Treasury (IEF)" },
  { sym: "SHY", name: "iShares 1-3 Year Treasury (SHY)" },
  { sym: "LQD", name: "iShares Investment Grade Corp (LQD)" },
  { sym: "HYG", name: "iShares High Yield Corp (HYG)" },
  { sym: "TIP", name: "iShares TIPS Bond (TIP)" },
  { sym: "BIL", name: "SPDR 1-3 Month T-Bill (BIL)" },
  { sym: "SGOV", name: "iShares 0-3 Month Treasury (SGOV)" },
  // ── 원자재 / 부동산 ──
  { sym: "GLD", name: "SPDR Gold Shares (GLD)" },
  { sym: "IAU", name: "iShares Gold Trust (IAU)" },
  { sym: "SLV", name: "iShares Silver Trust (SLV)" },
  { sym: "USO", name: "United States Oil Fund (USO)" },
  { sym: "VNQ", name: "Vanguard Real Estate (VNQ)" },
  { sym: "SCHH", name: "Schwab US REIT (SCHH)" },
  // ── 인컴 (커버드콜·배당, 국내개미 선호) ──
  { sym: "JEPI", name: "JPMorgan Equity Premium Income (JEPI)" },
  { sym: "JEPQ", name: "JPMorgan Nasdaq Equity Premium (JEPQ)" },
  { sym: "QYLD", name: "Global X NASDAQ 100 Covered Call (QYLD)" },
  { sym: "DIVO", name: "Amplify CWP Enhanced Dividend (DIVO)" },
  // ── 레버리지 / 인버스 (국내개미 활발 거래) ──
  { sym: "TQQQ", name: "ProShares UltraPro QQQ 3X (TQQQ)" },
  { sym: "SQQQ", name: "ProShares UltraPro Short QQQ 3X (SQQQ)" },
  { sym: "SOXL", name: "Direxion Semiconductor Bull 3X (SOXL)" },
  { sym: "SOXS", name: "Direxion Semiconductor Bear 3X (SOXS)" },
  { sym: "TSLL", name: "Direxion TSLA Bull 2X (TSLL)" },
];

function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

let cache: { at: number; data: unknown } | null = null;

// 콜드 캐시 때 ~75 ETF를 배치로 부르므로 함수 타임아웃 여유 확보
export const maxDuration = 60;

// 동시 호출 제한 — 야후 레이트리밋/타임아웃 방지(한 번에 limit개씩만 진행)
async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let idx = 0;
  async function worker() {
    while (idx < arr.length) {
      const cur = idx++;
      out[cur] = await fn(arr[cur]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => worker()));
  return out;
}

export async function GET() {
  if (cache && Date.now() - cache.at < 30 * 60 * 1000) {
    return NextResponse.json(cache.data);
  }
  const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);

  // 동시 10개씩만 — ~75 ETF를 ~8배치로 나눠 야후 부담 최소화(30분 캐시라 콜드로드만)
  const results = await mapLimit(UNIVERSE, 10, async (e) => {
      try {
        const ch = await yf.chart(e.sym, { period1, interval: "1d" });
        const quotes = (ch.quotes ?? []) as Array<{ close: number | null; volume: number | null }>;
        const closes = quotes
          .map((q) => q.close)
          .filter((c): c is number => typeof c === "number" && c > 0);
        if (closes.length < 22) return null;
        // 거래대금(USD) = 마지막 종가 × 마지막 유효 거래량 — 정렬 기준
        const lastClose = closes[closes.length - 1];
        let lastVolume = 0;
        for (let i = quotes.length - 1; i >= 0; i--) {
          const v = quotes[i].volume;
          if (typeof v === "number" && v > 0) { lastVolume = v; break; }
        }
        return {
          symbol: e.sym,
          name: e.name,
          price: lastClose,
          changePercent: ret(closes, 1) ?? 0,
          r1w: ret(closes, 5),
          r1m: ret(closes, 21),
          r3m: ret(closes, 63),
          r6m: ret(closes, 126),
          r1y: ret(closes, 252),
          amount: lastClose * lastVolume,
        };
      } catch {
        return null;
      }
    });

  const items = results.filter((x) => x !== null);
  items.sort((a, b) => (b!.amount ?? 0) - (a!.amount ?? 0));
  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
