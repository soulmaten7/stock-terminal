import { Calendar, FileText, Gem, Coins, TrendingDown, AlertTriangle, Star } from "lucide-react";
import { CardContainer } from "./CardContainer";

const LONGTERM_DISCLOSURES = [
  { code: "005930", name: "삼성전자", type: "현금배당 결정 (배당금 ₩1,361)", time: "어제" },
  { code: "000660", name: "SK하이닉스", type: "분기보고서 제출", time: "어제" },
  { code: "035720", name: "카카오", type: "자기주식 처분 신탁 계약", time: "2일 전" },
  { code: "035420", name: "NAVER", type: "회사분할 결정", time: "3일 전" },
  { code: "207940", name: "삼성바이오로직스", type: "유상증자 결정 (₩2조)", time: "1주 전" },
];

const EARNINGS_CALENDAR = [
  { code: "005930", name: "삼성전자", date: "2026-07-31", consensus: "12.4조" },
  { code: "000660", name: "SK하이닉스", date: "2026-07-29", consensus: "5.8조" },
  { code: "035720", name: "카카오", date: "2026-08-02", consensus: "3,400억" },
  { code: "035420", name: "NAVER", date: "2026-08-05", consensus: "4,200억" },
];

const SECTORS = [
  { name: "반도체", changePct: 2.1, status: "up" as const },
  { name: "자동차", changePct: 0.8, status: "up" as const },
  { name: "2차전지", changePct: 3.4, status: "up" as const },
  { name: "바이오", changePct: -1.3, status: "down" as const },
  { name: "금융", changePct: 0.4, status: "up" as const },
  { name: "조선", changePct: -0.7, status: "down" as const },
  { name: "건설", changePct: -2.1, status: "down" as const },
  { name: "유통", changePct: 0.2, status: "up" as const },
];

export function LongtermDisclosureCard() {
  return (
    <CardContainer
      id="card-disclosure"
      title="공시 · 실적·배당·증자"
      emoji="📊"
      subtitle="DART"
      hint="Layer 1 — DART 필터링 (실적·배당·증자만)"
    >
      <ul className="space-y-2">
        {LONGTERM_DISCLOSURES.map((d, i) => (
          <li
            key={`${d.code}-${i}`}
            className="flex items-start justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
          >
            <div className="flex items-start gap-2 min-w-0">
              <FileText size={12} className="text-unjong-muted flex-shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary truncate">
                  {d.name}
                </span>
                <span className="text-[10px] text-unjong-muted leading-tight">
                  {d.type}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-unjong-muted flex-shrink-0">
              {d.time}
            </span>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

export function EarningsCalendarCard() {
  return (
    <CardContainer
      id="card-earnings"
      title="분기 실적 캘린더"
      emoji="📅"
      subtitle="발표 예정"
      hint="Layer 1 — 자체 캘린더 + 컨센서스 데이터"
    >
      <ul className="space-y-2">
        {EARNINGS_CALENDAR.map((e) => (
          <li
            key={e.code}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Calendar size={12} className="text-unjong-muted flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary truncate">
                  {e.name}
                </span>
                <span className="text-[10px] text-unjong-muted">{e.date}</span>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-unjong-accent flex-shrink-0">
              {e.consensus}
            </span>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

export function SectorCard() {
  return (
    <CardContainer
      id="card-sector"
      title="섹터 히트맵"
      emoji="🗺️"
      subtitle="업종별 등락"
      hint="Layer 1 — KIS sector API + 히트맵 그래픽"
    >
      <div className="grid grid-cols-2 gap-1.5">
        {SECTORS.map((s) => (
          <div
            key={s.name}
            className={`flex items-center justify-between rounded px-2 py-1.5 text-xs cursor-pointer ${
              s.status === "up"
                ? "bg-emerald-50 hover:bg-emerald-100"
                : "bg-red-50 hover:bg-red-100"
            }`}
          >
            <span className="font-medium text-unjong-primary">{s.name}</span>
            <span
              className={`font-semibold text-[11px] ${
                s.status === "up" ? "text-unjong-success" : "text-unjong-danger"
              }`}
            >
              {s.status === "up" ? "+" : ""}
              {s.changePct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </CardContainer>
  );
}

const VALUE_STOCKS = [
  { code: "105560", name: "KB금융", per: 6.2, pbr: 0.61, roe: 9.8, score: "A+" as const },
  { code: "029780", name: "삼성카드", per: 7.1, pbr: 0.55, roe: 8.3, score: "A" as const },
  { code: "316140", name: "우리금융지주", per: 5.4, pbr: 0.43, roe: 8.7, score: "A" as const },
  { code: "055550", name: "신한지주", per: 6.8, pbr: 0.58, roe: 9.1, score: "A+" as const },
  { code: "012330", name: "현대모비스", per: 8.3, pbr: 0.72, roe: 9.4, score: "B+" as const },
];

const DIVIDEND_TOP = [
  { code: "030200", name: "KT", yieldPct: 6.45, exDate: "2026-12-30", amount: "₩1,960" },
  { code: "029780", name: "삼성카드", yieldPct: 5.82, exDate: "2026-12-27", amount: "₩2,000" },
  { code: "086790", name: "하나금융지주", yieldPct: 5.43, exDate: "2026-12-29", amount: "₩3,400" },
  { code: "138930", name: "BNK금융지주", yieldPct: 5.21, exDate: "2026-12-28", amount: "₩820" },
  { code: "000990", name: "DB하이텍", yieldPct: 4.85, exDate: "2026-12-26", amount: "₩1,500" },
];

const LOWS_52W = [
  { code: "051910", name: "LG화학", price: "₩312,000", lowPct: -32, marketCap: "22조", premium: true },
  { code: "096770", name: "SK이노베이션", price: "₩108,500", lowPct: -28, marketCap: "10조", premium: true },
  { code: "005490", name: "POSCO홀딩스", price: "₩278,000", lowPct: -24, marketCap: "24조", premium: true },
  { code: "068270", name: "셀트리온", price: "₩152,000", lowPct: -19, marketCap: "22조", premium: false },
  { code: "009830", name: "한화솔루션", price: "₩28,700", lowPct: -22, marketCap: "4조", premium: false },
];

const WARNING_STOCKS = [
  { code: "950140", name: "잉글우드랩", type: "관리종목" as const, reason: "감사의견 거절", severity: "high" as const },
  { code: "238500", name: "로보쓰리에이아이앤로보틱스", type: "투자유의" as const, reason: "불성실공시법인", severity: "mid" as const },
  { code: "013030", name: "하이록코리아", type: "단기과열" as const, reason: "5일 연속 상한가", severity: "low" as const },
  { code: "011040", name: "CJ씨푸드", type: "투자유의" as const, reason: "최대주주 변경 빈번", severity: "mid" as const },
  { code: "101160", name: "월덱스", type: "단기과열" as const, reason: "단기 급등 (3일 +45%)", severity: "low" as const },
];

const SCORE_STYLE: Record<"A+" | "A" | "B+", string> = {
  "A+": "bg-emerald-100 text-emerald-700",
  "A": "bg-blue-100 text-blue-700",
  "B+": "bg-amber-100 text-amber-700",
};

const WARNING_TYPE_STYLE: Record<"관리종목" | "투자유의" | "단기과열", string> = {
  "관리종목": "bg-red-100 text-red-700",
  "투자유의": "bg-orange-100 text-orange-700",
  "단기과열": "bg-amber-100 text-amber-700",
};

export function ValueScreenCard() {
  return (
    <CardContainer
      id="card-value"
      title="저평가 스크리너"
      emoji="💎"
      subtitle="PER·PBR·ROE"
      hint="Layer 1 — KIS 재무 API + 자체 스코어링"
    >
      <ul className="space-y-2">
        {VALUE_STOCKS.map((v) => (
          <li
            key={v.code}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Gem size={12} className="text-unjong-muted flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary truncate">{v.name}</span>
                <span className="text-[10px] text-unjong-muted">
                  PER {v.per} · PBR {v.pbr} · ROE {v.roe}%
                </span>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${SCORE_STYLE[v.score]}`}>
              {v.score}
            </span>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

export function DividendTopCard() {
  return (
    <CardContainer
      id="card-dividend"
      title="배당 TOP 5"
      emoji="💰"
      subtitle="배당수익률 순위"
      hint="Layer 1 — KIS 배당 데이터"
    >
      <ul className="space-y-2">
        {DIVIDEND_TOP.map((d) => (
          <li
            key={d.code}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Coins size={12} className="text-unjong-muted flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary truncate">{d.name}</span>
                <span className="text-[10px] text-unjong-muted">배당락 {d.exDate} · {d.amount}</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-unjong-success flex-shrink-0">
              {d.yieldPct.toFixed(2)}%
            </span>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

export function Lows52WCard() {
  return (
    <CardContainer
      id="card-lows"
      title="52주 신저가"
      emoji="📉"
      subtitle="우량주 신저가"
      hint="Layer 1 — KIS 52주 고저가 API"
    >
      <ul className="space-y-2">
        {LOWS_52W.map((s) => (
          <li
            key={s.code}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <TrendingDown size={12} className="text-unjong-danger flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-unjong-primary truncate">{s.name}</span>
                  {s.premium && (
                    <Star size={9} className="text-unjong-accent flex-shrink-0" fill="currentColor" />
                  )}
                </div>
                <span className="text-[10px] text-unjong-muted">{s.price} · 시총 {s.marketCap}</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-unjong-danger flex-shrink-0">
              {s.lowPct}%
            </span>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

export function WarningStockCard() {
  return (
    <CardContainer
      id="card-warning"
      title="관리·주의 종목"
      emoji="⚠️"
      subtitle="관리종목·투자유의·단기과열"
      hint="Layer 1 — KRX 관리·경고 API"
    >
      <ul className="space-y-2">
        {WARNING_STOCKS.map((w) => (
          <li
            key={w.code}
            className="flex items-start justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
          >
            <div className="flex items-start gap-2 min-w-0">
              <AlertTriangle size={12} className="text-unjong-danger flex-shrink-0 mt-0.5" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary truncate">{w.name}</span>
                <span className="text-[10px] text-unjong-muted leading-tight">{w.reason}</span>
              </div>
            </div>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 whitespace-nowrap ${WARNING_TYPE_STYLE[w.type]}`}>
              {w.type}
            </span>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}
