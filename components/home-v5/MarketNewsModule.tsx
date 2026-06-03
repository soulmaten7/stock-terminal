"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { LoadingState, ErrorState } from "@/components/ui/State";

type NewsItem = {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
};

const CATEGORIES = ["전체", "국내증시", "해외", "경제", "정책"] as const;
type Cat = (typeof CATEGORIES)[number];

// TODO: 분류 정교화 (현재 1차 휴리스틱 — RSS 가 카테고리를 안 줌)
function categorize(title: string): Cat {
  const t = title;
  if (/미국|나스닥|S&P|뉴욕|연준|FOMC|엔비디아|애플|테슬라|중국|일본|유럽/.test(t)) return "해외";
  if (/금리|환율|물가|GDP|수출|무역|고용|경기|반도체 업황/.test(t)) return "경제";
  if (/정부|금융위|금감원|규제|법안|정책|국회|세금/.test(t)) return "정책";
  if (/코스피|코스닥|증시|상한가|급등|급락|공시|실적|종목/.test(t)) return "국내증시";
  return "국내증시";
}

export default function MarketNewsModule() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState<Cat>("전체");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/news/market");
        const json = await r.json();
        if (!cancelled) setItems((json.items || []).slice(0, 10));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 5 * 60 * 1000); // 5분 갱신
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const filtered = cat === "전체" ? items : items.filter((n) => categorize(n.title) === cat);

  return (
    <section className="bg-unjong-surface rounded-lg border border-unjong-border p-4">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-unjong-primary">
          📰 시장 헤드라인
        </h2>
        <span className="text-xs text-unjong-muted italic">한경·매경·머니투데이·이데일리·연합</span>
      </header>

      {/* 카테고리 탭 */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
              cat === c ? "bg-unjong-primary text-white" : "bg-unjong-background text-unjong-muted hover:bg-slate-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <ErrorState title="뉴스 로딩 실패" />
      ) : filtered.length === 0 ? (
        <p className="text-xs text-unjong-muted text-center py-4">이 카테고리의 최근 헤드라인이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((item, i) => (
            <li key={i}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-unjong-background rounded p-2 hover:border-unjong-accent border border-transparent transition-colors"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 flex-shrink-0">
                    {item.publisher}
                  </span>
                  <span className="text-xs text-unjong-muted">
                    {new Date(item.publishedAt).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-sm text-unjong-primary leading-normal flex items-start gap-1">
                  <span className="flex-1">{item.title}</span>
                  <ExternalLink size={10} className="flex-shrink-0 mt-0.5 text-unjong-muted" />
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
