"use client";

import { useEffect, useState } from "react";
import { Calendar, FileText, Gem, Coins, TrendingDown, AlertTriangle, Star } from "lucide-react";
import { CardContainer } from "./CardContainer";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";

function inferKrMarket(code: string): "KOSPI" | "KOSDAQ" {
  return code.startsWith("0") ? "KOSPI" : "KOSDAQ";
}

// ── Types ────────────────────────────────────────────────────────────────────

type DisclosureItem  = { code: string; name: string; type: string; time: string; };
type EarningsItem    = { code: string; name: string; date: string; consensus: string; };
type SectorItem      = { name: string; changePct: number; status: "up" | "down"; };
type ValueItem       = { code: string; name: string; per: number; pbr: number; roe: number; score: "A+" | "A" | "B+"; };
type DividendItem    = { code: string; name: string; yield: number; exDate: string; dividend: string; };
type Lows52WItem     = { code: string; name: string; price: string; lowPct: number; marketCap: string; grade: "우량"; };
type WarningItem     = { code: string; name: string; type: "관리종목" | "투자유의" | "단기과열"; reason: string; severity: "high" | "medium"; };

// ── Fallback data ────────────────────────────────────────────────────────────

const LONGTERM_DISCLOSURES_FALLBACK: DisclosureItem[] = [
  { code: "005930", name: "삼성전자",       type: "현금배당 결정 (₩1,361)",  time: "어제"    },
  { code: "000660", name: "SK하이닉스",     type: "분기보고서 제출",           time: "어제"    },
  { code: "035720", name: "카카오",         type: "자기주식 처분 신탁 계약",   time: "2일 전"  },
  { code: "035420", name: "NAVER",          type: "회사분할 결정",             time: "3일 전"  },
  { code: "207940", name: "삼성바이오로직스", type: "유상증자 결정 (₩2조)",     time: "1주 전"  },
];

const EARNINGS_FALLBACK: EarningsItem[] = [
  { code: "005930", name: "삼성전자",       date: "2026-07-31", consensus: "12.4조"  },
  { code: "000660", name: "SK하이닉스",     date: "2026-07-29", consensus: "5.8조"   },
  { code: "035720", name: "카카오",         date: "2026-08-02", consensus: "3,400억" },
  { code: "035420", name: "NAVER",          date: "2026-08-05", consensus: "4,200억" },
];

const SECTOR_FALLBACK: SectorItem[] = [
  { name: "반도체",  changePct:  2.1, status: "up"   },
  { name: "자동차",  changePct:  0.8, status: "up"   },
  { name: "2차전지", changePct:  3.4, status: "up"   },
  { name: "바이오",  changePct: -1.3, status: "down" },
  { name: "금융",    changePct:  0.4, status: "up"   },
  { name: "조선",    changePct: -0.7, status: "down" },
  { name: "건설",    changePct: -2.1, status: "down" },
  { name: "유통",    changePct:  0.2, status: "up"   },
];

const VALUE_FALLBACK: ValueItem[] = [
  { code: "105560", name: "KB금융",       per: 6.2, pbr: 0.61, roe:  9.8, score: "A+"  },
  { code: "029780", name: "삼성카드",     per: 7.1, pbr: 0.55, roe:  8.3, score: "A"   },
  { code: "316140", name: "우리금융지주", per: 5.4, pbr: 0.43, roe:  8.7, score: "A"   },
  { code: "055550", name: "신한지주",     per: 6.8, pbr: 0.58, roe:  9.1, score: "A+"  },
  { code: "012330", name: "현대모비스",   per: 8.3, pbr: 0.72, roe:  9.4, score: "B+"  },
];

const DIVIDEND_FALLBACK: DividendItem[] = [
  { code: "030200", name: "KT",         yield: 6.45, exDate: "12/30", dividend: "1,960원" },
  { code: "029780", name: "삼성카드",   yield: 5.82, exDate: "12/27", dividend: "2,000원" },
  { code: "086790", name: "하나금융지주", yield: 5.43, exDate: "12/29", dividend: "3,400원" },
  { code: "138930", name: "BNK금융지주", yield: 5.21, exDate: "12/28", dividend: "820원"  },
  { code: "000990", name: "DB하이텍",   yield: 4.85, exDate: "12/26", dividend: "1,500원" },
];

const LOWS_FALLBACK: Lows52WItem[] = [
  { code: "051910", name: "LG화학",       price: "312,000", lowPct: -32, marketCap: "22.0조", grade: "우량" },
  { code: "096770", name: "SK이노베이션", price: "108,500", lowPct: -28, marketCap: "10.0조", grade: "우량" },
  { code: "005490", name: "POSCO홀딩스",  price: "278,000", lowPct: -24, marketCap: "24.0조", grade: "우량" },
  { code: "068270", name: "셀트리온",     price: "152,000", lowPct: -19, marketCap: "22.0조", grade: "우량" },
  { code: "009830", name: "한화솔루션",   price: "28,700",  lowPct: -22, marketCap: "4.0조",  grade: "우량" },
];

const WARNING_FALLBACK: WarningItem[] = [
  { code: "000000", name: "△△텔레콤", type: "관리종목", reason: "영업적자 2년 연속",       severity: "high"   },
  { code: "000001", name: "○○에너지", type: "투자유의", reason: "자본잠식 50% 초과",       severity: "high"   },
  { code: "000002", name: "××바이오", type: "단기과열", reason: "거래량 급증 + 주가 급등",  severity: "medium" },
  { code: "000003", name: "□□건설",  type: "관리종목", reason: "감사보고서 의견거절",       severity: "high"   },
  { code: "000004", name: "▽▽전자",  type: "투자유의", reason: "관리종목 지정 우려",        severity: "medium" },
];

// ── Style maps ───────────────────────────────────────────────────────────────

const SCORE_STYLE: Record<"A+" | "A" | "B+", string> = {
  "A+": "bg-emerald-100 text-emerald-700",
  "A":  "bg-blue-100 text-blue-700",
  "B+": "bg-amber-100 text-amber-700",
};

const WARNING_TYPE_STYLE: Record<"관리종목" | "투자유의" | "단기과열", string> = {
  "관리종목": "bg-red-100 text-red-700",
  "투자유의": "bg-orange-100 text-orange-700",
  "단기과열": "bg-amber-100 text-amber-700",
};

// ── Cards ────────────────────────────────────────────────────────────────────

export function LongtermDisclosureCard() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [data, setData] = useState<DisclosureItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/dart/disclosures-longterm", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rawList: DisclosureItem[] = Array.isArray(json.items) ? json.items : [];
        if (mounted) { setData(rawList.length > 0 ? rawList : null); setError(null); setLastUpdate(new Date()); }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const displayData = data ?? (error !== null ? LONGTERM_DISCLOSURES_FALLBACK : []);
  const isUsingFallback = data === null && error !== null;

  return (
    <CardContainer
      id="card-disclosure"
      detailHref="/longterm/disclosure"
      title="공시 · 실적·배당·증자"
      emoji="📊"
      subtitle={lastUpdate ? `DART · ${lastUpdate.toLocaleTimeString("ko-KR")}` : "DART"}
      hint={isUsingFallback ? "⚠️ 데이터 일시 불가" : undefined}
    >
      {loading && data === null && error === null ? (
        <div className="text-xs text-unjong-muted text-center py-4">⏳ 로딩 중...</div>
      ) : displayData.length === 0 ? (
        <div className="text-xs text-unjong-muted text-center py-4">데이터 없음</div>
      ) : (
        <ul className="space-y-2">
          {displayData.map((d, i) => (
            <li
              key={`${d.code}-${i}`}
              onClick={() => d.code ? setSelectedSymbol({ code: d.code, name: d.name, market: inferKrMarket(d.code) }) : undefined}
              className={`flex items-start justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 ${d.code ? "cursor-pointer" : "cursor-default"}`}
            >
              <div className="flex items-start gap-2 min-w-0">
                <FileText size={12} className="text-unjong-muted flex-shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary truncate">{d.name}</span>
                  <span className="text-[10px] text-unjong-muted leading-tight">{d.type}</span>
                </div>
              </div>
              <span className="text-[10px] text-unjong-muted flex-shrink-0">{d.time}</span>
            </li>
          ))}
        </ul>
      )}
    </CardContainer>
  );
}

export function EarningsCalendarCard() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [data, setData] = useState<EarningsItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/dart/earnings-calendar", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rawList: EarningsItem[] = Array.isArray(json.items) ? json.items : [];
        if (mounted) { setData(rawList.length > 0 ? rawList : null); setError(null); setLastUpdate(new Date()); }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 300_000); // 5분
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const displayData = data ?? (error !== null ? EARNINGS_FALLBACK : []);

  return (
    <CardContainer
      id="card-earnings"
      detailHref="/longterm/earnings"
      title="분기 실적 캘린더"
      emoji="📅"
      subtitle={lastUpdate ? `발표 예정 · ${lastUpdate.toLocaleTimeString("ko-KR")}` : "발표 예정"}
      hint={undefined}
    >
      {loading && data === null && error === null ? (
        <div className="text-xs text-unjong-muted text-center py-4">⏳ 로딩 중...</div>
      ) : displayData.length === 0 ? (
        <div className="text-xs text-unjong-muted text-center py-4">데이터 없음</div>
      ) : (
        <ul className="space-y-2">
          {displayData.map((e) => (
            <li
              key={e.code}
              onClick={() => setSelectedSymbol({ code: e.code, name: e.name, market: inferKrMarket(e.code) })}
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Calendar size={12} className="text-unjong-muted flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary truncate">{e.name}</span>
                  <span className="text-[10px] text-unjong-muted">{e.date}</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-unjong-accent flex-shrink-0">{e.consensus}</span>
            </li>
          ))}
        </ul>
      )}
    </CardContainer>
  );
}

export function SectorCard() {
  const [data, setData] = useState<SectorItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/kis/sector", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rawList: SectorItem[] = Array.isArray(json.items) ? json.items : [];
        if (mounted) { setData(rawList.length > 0 ? rawList : null); setError(null); setLastUpdate(new Date()); }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const displayData = data ?? (error !== null ? SECTOR_FALLBACK : []);

  return (
    <CardContainer
      id="card-sector"
      detailHref="/longterm/sector"
      title="섹터 히트맵"
      emoji="🗺️"
      subtitle={lastUpdate ? `실시간 · ${lastUpdate.toLocaleTimeString("ko-KR")}` : "업종별 등락"}
      hint={error ? "⚠️ 데이터 일시 불가" : undefined}
    >
      {loading && data === null && error === null ? (
        <div className="text-xs text-unjong-muted text-center py-4">⏳ 로딩 중...</div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {displayData.map((s) => (
            <div
              key={s.name}
              className={`flex items-center justify-between rounded px-2 py-1.5 text-xs cursor-default ${s.status === "up" ? "bg-emerald-50 hover:bg-emerald-100" : "bg-red-50 hover:bg-red-100"}`}
            >
              <span className="font-medium text-unjong-primary">{s.name}</span>
              <span className={`font-semibold text-[11px] ${s.status === "up" ? "text-unjong-success" : "text-unjong-danger"}`}>
                {s.status === "up" ? "+" : ""}{s.changePct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </CardContainer>
  );
}

export function ValueScreenCard() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [data, setData] = useState<ValueItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/db/value-stocks", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rawList: ValueItem[] = Array.isArray(json.items) ? json.items : [];
        if (mounted) { setData(rawList.length > 0 ? rawList : null); setError(null); setLastUpdate(new Date()); }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 300_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const displayData = data ?? (error !== null ? VALUE_FALLBACK : []);
  const isUsingFallback = data === null && error !== null;

  return (
    <CardContainer
      id="card-value"
      detailHref="/longterm/value"
      title="저평가 스크리너"
      emoji="💎"
      subtitle={lastUpdate ? `PER·PBR·ROE · ${lastUpdate.toLocaleTimeString("ko-KR")}` : "PER·PBR·ROE"}
      hint={isUsingFallback ? "⚠️ 데이터 일시 불가" : undefined}
    >
      {loading && data === null && error === null ? (
        <div className="text-xs text-unjong-muted text-center py-4">⏳ 로딩 중...</div>
      ) : displayData.length === 0 ? (
        <div className="text-xs text-unjong-muted text-center py-4">데이터 없음</div>
      ) : (
        <ul className="space-y-2">
          {displayData.map((v) => (
            <li
              key={v.code}
              onClick={() => setSelectedSymbol({ code: v.code, name: v.name, market: inferKrMarket(v.code) })}
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Gem size={12} className="text-unjong-muted flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary truncate">{v.name}</span>
                  <span className="text-[10px] text-unjong-muted">PER {v.per} · PBR {v.pbr} · ROE {v.roe}%</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${SCORE_STYLE[v.score]}`}>{v.score}</span>
            </li>
          ))}
        </ul>
      )}
    </CardContainer>
  );
}

export function DividendTopCard() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [data, setData] = useState<DividendItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/db/dividend-top", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rawList: DividendItem[] = Array.isArray(json.items) ? json.items : [];
        if (mounted) { setData(rawList.length > 0 ? rawList : null); setError(null); setLastUpdate(new Date()); }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 300_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const displayData = data ?? (error !== null ? DIVIDEND_FALLBACK : []);
  const isUsingFallback = data === null && error !== null;

  return (
    <CardContainer
      id="card-dividend"
      detailHref="/longterm/dividend"
      title="배당 TOP 5"
      emoji="💰"
      subtitle={lastUpdate ? `배당수익률 · ${lastUpdate.toLocaleTimeString("ko-KR")}` : "배당수익률 순위"}
      hint={isUsingFallback ? "⚠️ 데이터 일시 불가" : undefined}
    >
      {loading && data === null && error === null ? (
        <div className="text-xs text-unjong-muted text-center py-4">⏳ 로딩 중...</div>
      ) : displayData.length === 0 ? (
        <div className="text-xs text-unjong-muted text-center py-4">데이터 없음</div>
      ) : (
        <ul className="space-y-2">
          {displayData.map((d) => (
            <li
              key={d.code}
              onClick={() => setSelectedSymbol({ code: d.code, name: d.name, market: inferKrMarket(d.code) })}
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Coins size={12} className="text-unjong-muted flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-unjong-primary truncate">{d.name}</span>
                  <span className="text-[10px] text-unjong-muted">배당락 {d.exDate} · {d.dividend}</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-unjong-success flex-shrink-0">{Number(d.yield).toFixed(2)}%</span>
            </li>
          ))}
        </ul>
      )}
    </CardContainer>
  );
}

export function Lows52WCard() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [data, setData] = useState<Lows52WItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/db/52w-lows", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rawList: Lows52WItem[] = Array.isArray(json.items) ? json.items : [];
        if (mounted) { setData(rawList.length > 0 ? rawList : null); setError(null); setLastUpdate(new Date()); }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 300_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const displayData = data ?? (error !== null ? LOWS_FALLBACK : []);
  const isUsingFallback = data === null && error !== null;

  return (
    <CardContainer
      id="card-lows"
      detailHref="/longterm/lows"
      title="52주 신저가"
      emoji="📉"
      subtitle={lastUpdate ? `우량주 신저가 · ${lastUpdate.toLocaleTimeString("ko-KR")}` : "우량주 신저가"}
      hint={isUsingFallback ? "⚠️ 데이터 일시 불가" : undefined}
    >
      {loading && data === null && error === null ? (
        <div className="text-xs text-unjong-muted text-center py-4">⏳ 로딩 중...</div>
      ) : displayData.length === 0 ? (
        <div className="text-xs text-unjong-muted text-center py-4">데이터 없음</div>
      ) : (
        <ul className="space-y-2">
          {displayData.map((s) => (
            <li
              key={s.code}
              onClick={() => setSelectedSymbol({ code: s.code, name: s.name, price: s.price, market: inferKrMarket(s.code) })}
              className="flex items-center justify-between gap-2 text-xs hover:bg-unjong-background rounded px-2 py-1.5 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <TrendingDown size={12} className="text-unjong-danger flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-unjong-primary truncate">{s.name}</span>
                    {s.grade === "우량" && <Star size={9} className="text-unjong-accent flex-shrink-0" fill="currentColor" />}
                  </div>
                  <span className="text-[10px] text-unjong-muted">{s.price} · 시총 {s.marketCap}</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-unjong-danger flex-shrink-0">{s.lowPct}%</span>
            </li>
          ))}
        </ul>
      )}
    </CardContainer>
  );
}

export function WarningStockCard() {
  const setSelectedSymbol = useUnjongSelectedSymbol((s) => s.setSelectedSymbol);
  const [data, setData] = useState<WarningItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/krx/warning", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rawList: WarningItem[] = Array.isArray(json.items) ? json.items : [];
        if (mounted) { setData(rawList.length > 0 ? rawList : null); setError(null); setLastUpdate(new Date()); }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 300_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const displayData = data ?? (error !== null ? WARNING_FALLBACK : []);
  const isUsingFallback = data === null && error !== null;

  return (
    <CardContainer
      id="card-warning"
      detailHref="/longterm/warning"
      title="관리·주의 종목"
      emoji="⚠️"
      subtitle={lastUpdate ? `KRX · ${lastUpdate.toLocaleTimeString("ko-KR")}` : "관리종목·투자유의·단기과열"}
      hint={isUsingFallback ? "⚠️ 데이터 일시 불가" : undefined}
    >
      {loading && data === null && error === null ? (
        <div className="text-xs text-unjong-muted text-center py-4">⏳ 로딩 중...</div>
      ) : displayData.length === 0 ? (
        <div className="text-xs text-unjong-muted text-center py-4">데이터 없음</div>
      ) : (
        <ul className="space-y-2">
          {displayData.map((w) => (
            <li
              key={w.code}
              onClick={() => setSelectedSymbol({ code: w.code, name: w.name, market: inferKrMarket(w.code) })}
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
      )}
    </CardContainer>
  );
}
