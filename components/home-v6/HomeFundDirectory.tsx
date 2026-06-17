"use client";

import { useEffect, useMemo, useState } from "react";

type Fund = { code: string; stdCode: string; name: string; type: string; setupDate: string };

const TYPES = ["전체", "주식형", "채권형", "혼합형", "단기금융", "부동산", "재간접", "특별자산"];

function fmtDate(s: string): string {
  if (!s || s.length !== 8) return "—";
  return `${s.slice(0, 4)}.${s.slice(4, 6)}`;
}
function typeBadge(t: string): string {
  if (t.includes("주식")) return "bg-[#F04452]/10 text-[#F04452]";
  if (t.includes("채권")) return "bg-[#3182F6]/10 text-[#3182F6]";
  if (t.includes("혼합")) return "bg-[#7C3AED]/10 text-[#7C3AED]";
  if (t.includes("단기") || t.includes("금융") || t.includes("MMF")) return "bg-[#12B886]/10 text-[#12B886]";
  if (t.includes("부동산") || t.includes("특별")) return "bg-[#F59F00]/10 text-[#F59F00]";
  return "bg-unjong-background text-unjong-muted";
}
const naverFund = (name: string) =>
  `https://search.naver.com/search.naver?query=${encodeURIComponent(name + " 펀드 기준가")}`;

export default function HomeFundDirectory() {
  const [type, setType] = useState("전체");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Fund[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 유형 변경 → 초기화 후 1페이지
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setItems([]);
    setPage(1);
    (async () => {
      try {
        const p = new URLSearchParams({ page: "1", rows: "100" });
        if (type !== "전체") p.set("type", type);
        const j = await (await fetch(`/api/fund?${p.toString()}`)).json();
        if (!cancelled) {
          setItems((j.funds ?? []) as Fund[]);
          setTotalCount(Number(j.totalCount ?? 0));
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type]);

  async function loadMore() {
    const next = page + 1;
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(next), rows: "100" });
      if (type !== "전체") p.set("type", type);
      const j = await (await fetch(`/api/fund?${p.toString()}`)).json();
      setItems((prev) => [...prev, ...((j.funds ?? []) as Fund[])]);
      setPage(next);
    } catch {
      /* keep */
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return items;
    return items.filter((f) => f.name.includes(q));
  }, [items, query]);

  const hasMore = items.length < totalCount;

  return (
    <div>
      {/* 검색 + 유형 필터 */}
      <div className="mb-3 space-y-2.5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="펀드명 검색 (불러온 목록에서)"
          className="w-full rounded-xl border border-unjong-border bg-unjong-surface px-4 py-2.5 text-sm text-unjong-primary outline-none focus:border-unjong-primary"
        />
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                type === t ? "bg-unjong-primary text-white" : "text-unjong-muted hover:bg-unjong-background"
              }`}
            >
              {t}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-unjong-muted">
            {type} {totalCount.toLocaleString()}개 · 불러옴 {items.length.toLocaleString()}
          </span>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-unjong-border bg-unjong-surface shadow-soft">
        {loading && items.length === 0 ? (
          <div className="py-10 text-center text-sm text-unjong-muted">불러오는 중…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-unjong-muted">불러온 목록에 "{query}" 없음.</p>
            {query.trim() && (
              <a
                href={naverFund(query)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs font-medium text-unjong-primary underline"
              >
                네이버 금융에서 "{query}" 펀드 검색 →
              </a>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-unjong-border text-xs text-unjong-muted">
                  <th className="px-4 py-2.5 text-left font-medium">펀드명</th>
                  <th className="px-4 py-2.5 text-left font-medium whitespace-nowrap">유형</th>
                  <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">설정일</th>
                  <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">상세</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 300).map((f) => (
                  <tr key={f.code + f.stdCode} className="border-b border-unjong-border last:border-0 hover:bg-unjong-background">
                    <td className="px-4 py-3">
                      <span className="font-medium text-unjong-primary">{f.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${typeBadge(f.type)}`}>{f.type || "기타"}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-unjong-muted">{fmtDate(f.setupDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <a href={naverFund(f.name)} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-unjong-primary hover:underline">
                        기준가 →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && !query.trim() && (
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className="w-full border-t border-unjong-border py-3 text-sm font-medium text-unjong-muted hover:bg-unjong-background disabled:opacity-50"
              >
                {loading ? "불러오는 중…" : "더 보기"}
              </button>
            )}
          </div>
        )}
      </section>

      <p className="mt-2 px-1 text-[11px] text-unjong-muted">
        운종은 국내 공모펀드를 유형별로 모아 보여줘요. 기준가·수익률 상세는{" "}
        <a href="https://fund.kofia.or.kr" target="_blank" rel="noopener noreferrer" className="underline">
          KOFIA 펀드정보
        </a>{" "}
        또는 각 행 '기준가→'에서. (금융위 공공데이터 · 영업일+1 갱신)
      </p>
    </div>
  );
}
