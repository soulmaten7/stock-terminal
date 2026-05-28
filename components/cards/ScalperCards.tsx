"use client";

import { TrendingUp, FileText } from "lucide-react";
import { CardContainer } from "./CardContainer";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";

const VI_EVENTS = [
  { code: "247540", name: "에코프로비엠", state: "발동" as const, type: "정적", time: "14:32", changePct: 12.5, price: "412,000" },
  { code: "086520", name: "에코프로", state: "발동" as const, type: "동적", time: "14:28", changePct: 8.7, price: "892,000" },
  { code: "035720", name: "카카오", state: "해제" as const, type: "정적", time: "14:25", changePct: 10.2, price: "53,400" },
  { code: "032500", name: "케이엠더블유", state: "발동" as const, type: "정적", time: "14:21", changePct: 11.4, price: "78,200" },
  { code: "005490", name: "POSCO홀딩스", state: "해제" as const, type: "정적", time: "14:15", changePct: -8.2, price: "342,500" },
];

const NETBUY_WITH_BROKERS = [
  { code: "005930", name: "삼성전자", foreign: 124, institution: -85, topBroker: "키움증권" },
  { code: "000660", name: "SK하이닉스", foreign: 89, institution: 42, topBroker: "한국투자" },
  { code: "035720", name: "카카오", foreign: 56, institution: 28, topBroker: "미래에셋" },
  { code: "035420", name: "NAVER", foreign: 34, institution: -12, topBroker: "NH투자" },
  { code: "247540", name: "에코프로비엠", foreign: 78, institution: 51, topBroker: "키움증권" },
];

const THEME_TOP10 = [
  { rank: 1, name: "AI/반도체", changePct: 4.2, leader: "삼성전자" },
  { rank: 2, name: "2차전지", changePct: 3.8, leader: "에코프로" },
  { rank: 3, name: "로봇", changePct: 5.2, leader: "두산로보틱스" },
  { rank: 4, name: "우주항공", changePct: 2.1, leader: "한화에어로스페이스" },
  { rank: 5, name: "원전", changePct: 1.8, leader: "두산에너빌리티" },
  { rank: 6, name: "조선", changePct: 1.2, leader: "HD현대중공업" },
  { rank: 7, name: "방산", changePct: 0.9, leader: "LIG넥스원" },
  { rank: 8, name: "바이오", changePct: -1.3, leader: "삼성바이오로직스" },
  { rank: 9, name: "K-콘텐츠", changePct: -0.5, leader: "JYP Ent." },
  { rank: 10, name: "리오프닝", changePct: -2.1, leader: "하나투어" },
];

const SHORT_INTEREST = [
  { code: "035720", name: "카카오", ratio: 4.5, delta: -0.8, signal: "숏커버" as const },
  { code: "005930", name: "삼성전자", ratio: 1.2, delta: -0.3, signal: "숏커버" as const },
  { code: "000660", name: "SK하이닉스", ratio: 2.8, delta: 0.5, signal: "위험증가" as const },
  { code: "247540", name: "에코프로비엠", ratio: 3.1, delta: 0.7, signal: "위험증가" as const },
  { code: "035420", name: "NAVER", ratio: 1.8, delta: -0.2, signal: "안정" as const },
];

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

function inferKrMarket(code: string): "KOSPI" | "KOSDAQ" {
  return code.startsWith("0") ? "KOSPI" : "KOSDAQ";
}

export function MoversCard() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);

  return (
    <CardContainer
      id="card-movers"
      detailHref="/scalper/movers"
      title="Movers · 등락률 TOP"
      emoji="🚀"
      subtitle="실시간 KOSPI/KOSDAQ"
      hint="Layer 1 — KIS ranking API 연결 예정"
    >
      <ul className="space-y-2">
        {MOVERS.map((m, i) => (
          <li
            key={m.code}
            onClick={() =>
              setSelectedSymbol({
                code: m.code,
                name: m.name,
                price: m.price,
                changePct: m.changePct,
                market: inferKrMarket(m.code),
              })
            }
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
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);

  return (
    <CardContainer
      id="card-volume"
      detailHref="/scalper/volume"
      title="Volume · 거래량 폭증"
      emoji="🔥"
      subtitle="전일 대비 3배+"
      hint="Layer 1 — KIS volume-rank API 연결 예정"
    >
      <ul className="space-y-2">
        {VOLUME_SURGE.map((v) => (
          <li
            key={v.code}
            onClick={() =>
              setSelectedSymbol({
                code: v.code,
                name: v.name,
                market: inferKrMarket(v.code),
              })
            }
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

export function ViCard() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);

  return (
    <CardContainer
      id="card-vi"
      detailHref="/scalper/vi"
      title="VI · 변동성 완화장치"
      emoji="🚨"
      subtitle="실시간 발동/해제"
      hint="Layer 1 — KIS VI API 실시간 연결 예정"
    >
      <ul className="space-y-2">
        {VI_EVENTS.map((v, i) => {
          const isTriggered = v.state === "발동";
          const isUp = v.changePct >= 0;
          return (
            <li
              key={`${v.code}-${i}`}
              onClick={() =>
                setSelectedSymbol({
                  code: v.code,
                  name: v.name,
                  price: v.price,
                  changePct: v.changePct,
                  market: inferKrMarket(v.code),
                })
              }
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isTriggered ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {v.state}
                </span>
                <span className="text-[10px] text-unjong-muted">{v.type}</span>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary truncate">{v.name}</span>
                  <span className="text-[10px] text-unjong-muted">{v.code}</span>
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="font-semibold text-unjong-primary tabular-nums">{v.price}</span>
                <span className={`text-[10px] font-semibold ${isUp ? "text-unjong-success" : "text-unjong-danger"}`}>
                  {isUp ? "+" : ""}{v.changePct.toFixed(1)}% · {v.time}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}

export function NetBuyBrokerCard() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);

  return (
    <CardContainer
      id="card-netbuy"
      detailHref="/scalper/netbuy"
      title="NetBuy + 거래원"
      emoji="💰"
      subtitle="외인·기관 + 매수 1위"
      hint="Layer 1 — KIS investor + 거래원 API"
    >
      <ul className="space-y-2">
        {NETBUY_WITH_BROKERS.map((n) => {
          const foreignUp = n.foreign >= 0;
          const instUp = n.institution >= 0;
          return (
            <li
              key={n.code}
              onClick={() =>
                setSelectedSymbol({
                  code: n.code,
                  name: n.name,
                  market: inferKrMarket(n.code),
                })
              }
              className="flex flex-col gap-1 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-unjong-primary">{n.name}</span>
                <span className="text-[10px] text-unjong-muted">
                  거래원 1위{" "}
                  <span className="font-semibold text-unjong-accent">{n.topBroker}</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="text-unjong-muted">외인</span>
                  <span className={foreignUp ? "text-unjong-success font-semibold" : "text-unjong-danger font-semibold"}>
                    {foreignUp ? "+" : ""}{n.foreign}억
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-unjong-muted">기관</span>
                  <span className={instUp ? "text-unjong-success font-semibold" : "text-unjong-danger font-semibold"}>
                    {instUp ? "+" : ""}{n.institution}억
                  </span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}

export function ThemeTop10Card() {
  return (
    <CardContainer
      id="card-theme"
      detailHref="/scalper/theme"
      title="테마 TOP10"
      emoji="🎯"
      subtitle="실시간 등락률 순"
      hint="Layer 1 — KIS theme API 또는 자체 테마 매핑"
    >
      <ul className="space-y-1.5">
        {THEME_TOP10.map((t) => {
          const isUp = t.changePct >= 0;
          return (
            <li
              key={t.rank}
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1 cursor-default"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-unjong-muted w-4 text-right text-[10px]">{t.rank}</span>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary truncate">{t.name}</span>
                  <span className="text-[10px] text-unjong-muted truncate">대표 · {t.leader}</span>
                </div>
              </div>
              <span className={`text-[11px] font-semibold flex-shrink-0 ${isUp ? "text-unjong-success" : "text-unjong-danger"}`}>
                {isUp ? "+" : ""}{t.changePct.toFixed(1)}%
              </span>
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}

export function ShortInterestCard() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);

  return (
    <CardContainer
      id="card-short"
      detailHref="/scalper/short"
      title="공매도 잔고 변화"
      emoji="⚠️"
      subtitle="숏커버·위험 시그널"
      hint="Layer 1 — KRX 공매도 데이터 수집"
    >
      <ul className="space-y-2">
        {SHORT_INTEREST.map((s) => {
          const signalColor =
            s.signal === "숏커버"
              ? "bg-emerald-100 text-emerald-700"
              : s.signal === "위험증가"
              ? "bg-red-100 text-red-700"
              : "bg-slate-100 text-slate-600";
          const deltaPositive = s.delta >= 0;
          return (
            <li
              key={s.code}
              onClick={() =>
                setSelectedSymbol({
                  code: s.code,
                  name: s.name,
                  market: inferKrMarket(s.code),
                })
              }
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${signalColor}`}>
                  {s.signal}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary truncate">{s.name}</span>
                  <span className="text-[10px] text-unjong-muted">{s.code}</span>
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="font-semibold text-unjong-primary tabular-nums">{s.ratio.toFixed(1)}%</span>
                <span className={`text-[10px] font-semibold ${deltaPositive ? "text-unjong-danger" : "text-unjong-success"}`}>
                  전일比 {deltaPositive ? "+" : ""}{s.delta.toFixed(1)}%p
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </CardContainer>
  );
}

export function ScalperDisclosureCard() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);

  return (
    <CardContainer
      id="card-disclosure"
      detailHref="/scalper/disclosure"
      title="공시 · 실시간"
      emoji="📄"
      subtitle="DART"
      hint="Layer 1 — DART Open API 연결 (기존 V3 재활용)"
    >
      <ul className="space-y-2">
        {DISCLOSURES.map((d, i) => (
          <li
            key={`${d.code}-${i}`}
            onClick={() =>
              setSelectedSymbol({
                code: d.code,
                name: d.name,
                market: inferKrMarket(d.code),
              })
            }
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
