import { Calendar, FileText } from "lucide-react";
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
