"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { CardContainer } from "./CardContainer";
import { useUnjongSelectedSymbol } from "@/stores/unjongSelectedSymbolStore";
import { LoadingState, EmptyState } from "@/components/ui/State";

function inferKrMarket(code: string): "KOSPI" | "KOSDAQ" {
  return code.startsWith("0") ? "KOSPI" : "KOSDAQ";
}

// ── Types ────────────────────────────────────────────────────────────────────

type DisclosureItem = { code: string; name: string; type: string; time: string; };

// ── Fallback data ────────────────────────────────────────────────────────────

const LONGTERM_DISCLOSURES_FALLBACK: DisclosureItem[] = [
  { code: "005930", name: "삼성전자",       type: "현금배당 결정 (₩1,361)",  time: "어제"    },
  { code: "000660", name: "SK하이닉스",     type: "분기보고서 제출",           time: "어제"    },
  { code: "035720", name: "카카오",         type: "자기주식 처분 신탁 계약",   time: "2일 전"  },
  { code: "035420", name: "NAVER",          type: "회사분할 결정",             time: "3일 전"  },
  { code: "207940", name: "삼성바이오로직스", type: "유상증자 결정 (₩2조)",     time: "1주 전"  },
];

// ── Cards ────────────────────────────────────────────────────────────────────

export function LongtermDisclosureCard() {
  const router = useRouter();
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
      id="card-longterm-disclosure"
      detailHref="/kr/longterm-disclosure"
      title="공시 · 실적·배당·증자"
      emoji="📊"
      subtitle={lastUpdate ? `DART · ${lastUpdate.toLocaleTimeString("ko-KR")}` : "DART"}
      hint={isUsingFallback ? "⚠️ 데이터 일시 불가" : undefined}
    >
      {loading && data === null && error === null ? (
        <LoadingState />
      ) : displayData.length === 0 ? (
        <EmptyState title="데이터 없음" />
      ) : (
        <ul className="space-y-2">
          {displayData.map((d, i) => (
            <li
              key={`${d.code}-${i}`}
              onClick={() => {
                if (!d.code) return;
                setSelectedSymbol({ code: d.code, name: d.name, market: inferKrMarket(d.code) });
                router.push(`/stock/${d.code}`);
              }}
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
