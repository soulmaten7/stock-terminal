import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const yf = new YahooFinance();

// 미국 대표 종목 (티커·영문 약식명). S&P100 메가캡 + 나스닥100 + 국내개미 선호주.
// 주식만(ETF/ETN 제외 — 이번 라운드 보류). 티커는 Yahoo 순수 심볼(접미사 없음).
const UNIVERSE: { sym: string; name: string }[] = [
  // ── 메가캡 테크 ──
  { sym: "AAPL", name: "Apple" },
  { sym: "MSFT", name: "Microsoft" },
  { sym: "NVDA", name: "NVIDIA" },
  { sym: "GOOGL", name: "Alphabet (A)" },
  { sym: "GOOG", name: "Alphabet (C)" },
  { sym: "AMZN", name: "Amazon" },
  { sym: "META", name: "Meta Platforms" },
  { sym: "TSLA", name: "Tesla" },
  { sym: "AVGO", name: "Broadcom" },
  { sym: "ORCL", name: "Oracle" },
  { sym: "NFLX", name: "Netflix" },
  { sym: "ADBE", name: "Adobe" },
  { sym: "CRM", name: "Salesforce" },
  { sym: "CSCO", name: "Cisco" },
  { sym: "AMD", name: "AMD" },
  { sym: "INTC", name: "Intel" },
  { sym: "QCOM", name: "Qualcomm" },
  { sym: "TXN", name: "Texas Instruments" },
  { sym: "IBM", name: "IBM" },
  { sym: "NOW", name: "ServiceNow" },
  { sym: "INTU", name: "Intuit" },
  { sym: "AMAT", name: "Applied Materials" },
  { sym: "MU", name: "Micron" },
  { sym: "LRCX", name: "Lam Research" },
  { sym: "KLAC", name: "KLA" },
  { sym: "ADI", name: "Analog Devices" },
  { sym: "NXPI", name: "NXP Semiconductors" },
  { sym: "MRVL", name: "Marvell" },
  { sym: "SNPS", name: "Synopsys" },
  { sym: "CDNS", name: "Cadence" },
  { sym: "PANW", name: "Palo Alto Networks" },
  { sym: "FTNT", name: "Fortinet" },
  { sym: "ANET", name: "Arista Networks" },
  { sym: "DELL", name: "Dell" },
  { sym: "HPQ", name: "HP" },
  { sym: "MCHP", name: "Microchip" },
  // ── 반도체/AI 인기주 (국내개미) ──
  { sym: "SMCI", name: "Super Micro" },
  { sym: "ARM", name: "Arm Holdings" },
  { sym: "TSM", name: "TSMC" },
  { sym: "ASML", name: "ASML" },
  { sym: "PLTR", name: "Palantir" },
  { sym: "SNOW", name: "Snowflake" },
  { sym: "NET", name: "Cloudflare" },
  { sym: "CRWD", name: "CrowdStrike" },
  { sym: "DDOG", name: "Datadog" },
  { sym: "ZS", name: "Zscaler" },
  { sym: "MDB", name: "MongoDB" },
  { sym: "U", name: "Unity Software" },
  { sym: "SHOP", name: "Shopify" },
  { sym: "SQ", name: "Block" },
  { sym: "PYPL", name: "PayPal" },
  { sym: "COIN", name: "Coinbase" },
  { sym: "HOOD", name: "Robinhood" },
  { sym: "SOFI", name: "SoFi" },
  { sym: "MSTR", name: "MicroStrategy" },
  { sym: "ROKU", name: "Roku" },
  { sym: "RBLX", name: "Roblox" },
  { sym: "DOCU", name: "DocuSign" },
  { sym: "TWLO", name: "Twilio" },
  { sym: "TEAM", name: "Atlassian" },
  { sym: "WDAY", name: "Workday" },
  { sym: "DASH", name: "DoorDash" },
  { sym: "ABNB", name: "Airbnb" },
  { sym: "UBER", name: "Uber" },
  { sym: "LYFT", name: "Lyft" },
  { sym: "SPOT", name: "Spotify" },
  { sym: "PINS", name: "Pinterest" },
  { sym: "SNAP", name: "Snap" },
  { sym: "DKNG", name: "DraftKings" },
  // ── EV / 우주 / 미래모빌리티 (국내개미) ──
  { sym: "RIVN", name: "Rivian" },
  { sym: "LCID", name: "Lucid" },
  { sym: "NIO", name: "NIO" },
  { sym: "XPEV", name: "XPeng" },
  { sym: "LI", name: "Li Auto" },
  { sym: "JOBY", name: "Joby Aviation" },
  { sym: "RKLB", name: "Rocket Lab" },
  { sym: "ACHR", name: "Archer Aviation" },
  { sym: "PLUG", name: "Plug Power" },
  { sym: "ENPH", name: "Enphase Energy" },
  { sym: "FSLR", name: "First Solar" },
  { sym: "RUN", name: "Sunrun" },
  // ── 통신/미디어 ──
  { sym: "TMUS", name: "T-Mobile" },
  { sym: "VZ", name: "Verizon" },
  { sym: "T", name: "AT&T" },
  { sym: "CMCSA", name: "Comcast" },
  { sym: "DIS", name: "Disney" },
  { sym: "WBD", name: "Warner Bros. Discovery" },
  { sym: "PARA", name: "Paramount" },
  { sym: "EA", name: "Electronic Arts" },
  { sym: "TTWO", name: "Take-Two" },
  // ── 금융 ──
  { sym: "BRK-B", name: "Berkshire Hathaway (B)" },
  { sym: "JPM", name: "JPMorgan Chase" },
  { sym: "BAC", name: "Bank of America" },
  { sym: "WFC", name: "Wells Fargo" },
  { sym: "GS", name: "Goldman Sachs" },
  { sym: "MS", name: "Morgan Stanley" },
  { sym: "C", name: "Citigroup" },
  { sym: "SCHW", name: "Charles Schwab" },
  { sym: "BLK", name: "BlackRock" },
  { sym: "AXP", name: "American Express" },
  { sym: "V", name: "Visa" },
  { sym: "MA", name: "Mastercard" },
  { sym: "SPGI", name: "S&P Global" },
  { sym: "CB", name: "Chubb" },
  { sym: "PGR", name: "Progressive" },
  { sym: "USB", name: "U.S. Bancorp" },
  { sym: "PNC", name: "PNC Financial" },
  // ── 헬스케어 ──
  { sym: "LLY", name: "Eli Lilly" },
  { sym: "UNH", name: "UnitedHealth" },
  { sym: "JNJ", name: "Johnson & Johnson" },
  { sym: "ABBV", name: "AbbVie" },
  { sym: "MRK", name: "Merck" },
  { sym: "PFE", name: "Pfizer" },
  { sym: "TMO", name: "Thermo Fisher" },
  { sym: "ABT", name: "Abbott" },
  { sym: "DHR", name: "Danaher" },
  { sym: "AMGN", name: "Amgen" },
  { sym: "GILD", name: "Gilead Sciences" },
  { sym: "BMY", name: "Bristol-Myers Squibb" },
  { sym: "VRTX", name: "Vertex Pharma" },
  { sym: "REGN", name: "Regeneron" },
  { sym: "ISRG", name: "Intuitive Surgical" },
  { sym: "MDT", name: "Medtronic" },
  { sym: "CVS", name: "CVS Health" },
  { sym: "CI", name: "Cigna" },
  { sym: "ELV", name: "Elevance Health" },
  { sym: "MRNA", name: "Moderna" },
  { sym: "BIIB", name: "Biogen" },
  // ── 소비재 / 리테일 ──
  { sym: "WMT", name: "Walmart" },
  { sym: "COST", name: "Costco" },
  { sym: "HD", name: "Home Depot" },
  { sym: "LOW", name: "Lowe's" },
  { sym: "PG", name: "Procter & Gamble" },
  { sym: "KO", name: "Coca-Cola" },
  { sym: "PEP", name: "PepsiCo" },
  { sym: "MCD", name: "McDonald's" },
  { sym: "SBUX", name: "Starbucks" },
  { sym: "NKE", name: "Nike" },
  { sym: "TGT", name: "Target" },
  { sym: "MDLZ", name: "Mondelez" },
  { sym: "CL", name: "Colgate-Palmolive" },
  { sym: "MO", name: "Altria" },
  { sym: "PM", name: "Philip Morris" },
  { sym: "CMG", name: "Chipotle" },
  { sym: "BKNG", name: "Booking Holdings" },
  { sym: "MAR", name: "Marriott" },
  { sym: "LULU", name: "Lululemon" },
  { sym: "ORLY", name: "O'Reilly Automotive" },
  { sym: "MNST", name: "Monster Beverage" },
  { sym: "KDP", name: "Keurig Dr Pepper" },
  { sym: "KHC", name: "Kraft Heinz" },
  { sym: "GM", name: "General Motors" },
  { sym: "F", name: "Ford" },
  // ── 산업재 / 에너지 / 소재 ──
  { sym: "CAT", name: "Caterpillar" },
  { sym: "BA", name: "Boeing" },
  { sym: "GE", name: "GE Aerospace" },
  { sym: "HON", name: "Honeywell" },
  { sym: "RTX", name: "RTX" },
  { sym: "LMT", name: "Lockheed Martin" },
  { sym: "DE", name: "Deere" },
  { sym: "UPS", name: "UPS" },
  { sym: "UNP", name: "Union Pacific" },
  { sym: "MMM", name: "3M" },
  { sym: "GD", name: "General Dynamics" },
  { sym: "EMR", name: "Emerson Electric" },
  { sym: "ETN", name: "Eaton" },
  { sym: "XOM", name: "Exxon Mobil" },
  { sym: "CVX", name: "Chevron" },
  { sym: "COP", name: "ConocoPhillips" },
  { sym: "SLB", name: "Schlumberger" },
  { sym: "EOG", name: "EOG Resources" },
  { sym: "OXY", name: "Occidental" },
  { sym: "PSX", name: "Phillips 66" },
  { sym: "MPC", name: "Marathon Petroleum" },
  { sym: "LIN", name: "Linde" },
  { sym: "FCX", name: "Freeport-McMoRan" },
  { sym: "NEM", name: "Newmont" },
  { sym: "NUE", name: "Nucor" },
  // ── 유틸리티 / 부동산 ──
  { sym: "NEE", name: "NextEra Energy" },
  { sym: "DUK", name: "Duke Energy" },
  { sym: "SO", name: "Southern Company" },
  { sym: "AMT", name: "American Tower" },
  { sym: "PLD", name: "Prologis" },
  { sym: "EQIX", name: "Equinix" },
  // ── 기타 메가/대형 ──
  { sym: "ACN", name: "Accenture" },
  { sym: "PDD", name: "PDD Holdings" },
  { sym: "BABA", name: "Alibaba" },
  { sym: "JD", name: "JD.com" },
  { sym: "MELI", name: "MercadoLibre" },
  { sym: "GEV", name: "GE Vernova" },
  { sym: "APP", name: "AppLovin" },
  { sym: "CEG", name: "Constellation Energy" },
  { sym: "VST", name: "Vistra" },
];

function ret(closes: number[], daysAgo: number): number | null {
  if (closes.length < daysAgo + 1) return null;
  const past = closes[closes.length - 1 - daysAgo];
  const now = closes[closes.length - 1];
  if (!past || !now) return null;
  return (now / past - 1) * 100;
}

let cache: { at: number; data: unknown } | null = null;

// 콜드 캐시 때 ~190종목을 배치로 부르므로 함수 타임아웃 여유 확보
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

  // 동시 10개씩만 — 193종목을 ~20배치로 나눠 야후 부담 최소화(30분 캐시라 콜드로드만)
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
