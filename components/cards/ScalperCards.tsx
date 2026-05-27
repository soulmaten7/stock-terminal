import { TrendingUp, FileText } from "lucide-react";
import { CardContainer } from "./CardContainer";

const MOVERS = [
  { code: "247540", name: "에코프로비엠", price: "412,000", changePct: 12.5 },
  { code: "035720", name: "카카오", price: "53,400", changePct: 10.2 },
  { code: "086520", name: "에코프로", price: "892,000", changePct: 8.7 },
  { code: "005930", name: "삼성전자", price: "82,100", changePct: 7.4 },
  { code: "000660", name: "SK하이닉스", price: "248,500", changePct: 6.1 },
];

const VOLUME_SURGE = [
  { code: "005930", name: "삼성전자", volume: "12,847,234", ratio: "5.2x" },
  { code: "035720", name: "카카오", volume: "8,234,567", ratio: "4.1x" },
  { code: "207940", name: "삼성바이오로직스", volume: "1,123,456", ratio: "3.8x" },
  { code: "035420", name: "NAVER", volume: "5,678,901", ratio: "3.2x" },
];

const DISCLOSURES = [
  { code: "005930", name: "삼성전자", type: "자기주식 취득", time: "10:42" },
  { code: "035720", name: "카카오", type: "주식분할 결정", time: "10:38" },
  { code: "000660", name: "SK하이닉스", type: "단일판매 계약", time: "10:25" },
  { code: "207940", name: "삼성바이오로직스", type: "특별관계자 거래", time: "10:18" },
  { code: "035420", name: "NAVER", type: "유상증자 결정", time: "10:05" },
];

export function MoversCard() {
  return (
    <CardContainer
      title="Movers · 등락률 TOP"
      emoji="🚀"
      subtitle="실시간 KOSPI/KOSDAQ"
      hint="Layer 1 — KIS ranking API 연결 예정"
    >
      <ul className="space-y-2">
        {MOVERS.map((m, i) => (
          <li
            key={m.code}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-unjong-muted font-mono w-4 text-right">
                {i + 1}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary truncate">
                  {m.name}
                </span>
                <span className="text-[10px] text-unjong-muted">{m.code}</span>
              </div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="font-semibold text-unjong-primary">{m.price}</span>
              <span className="flex items-center gap-0.5 text-[10px] text-unjong-success font-semibold">
                <TrendingUp size={10} />+{m.changePct.toFixed(1)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

export function VolumeCard() {
  return (
    <CardContainer
      title="Volume · 거래량 폭증"
      emoji="🔥"
      subtitle="전일 대비 3배+"
      hint="Layer 1 — KIS volume-rank API 연결 예정"
    >
      <ul className="space-y-2">
        {VOLUME_SURGE.map((v) => (
          <li
            key={v.code}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
          >
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-unjong-primary truncate">
                {v.name}
              </span>
              <span className="text-[10px] text-unjong-muted font-mono">
                {v.volume} 주
              </span>
            </div>
            <span className="text-[11px] font-bold text-unjong-accent flex-shrink-0">
              {v.ratio}
            </span>
          </li>
        ))}
      </ul>
    </CardContainer>
  );
}

export function ScalperDisclosureCard() {
  return (
    <CardContainer
      title="공시 · 실시간"
      emoji="📄"
      subtitle="DART"
      hint="Layer 1 — DART Open API 연결 (기존 V3 재활용)"
    >
      <ul className="space-y-2">
        {DISCLOSURES.map((d, i) => (
          <li
            key={`${d.code}-${i}`}
            className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={12} className="text-unjong-muted flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-unjong-primary truncate">
                  {d.name}
                </span>
                <span className="text-[10px] text-unjong-muted truncate">
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
