'use client';

import { useEffect, useState } from 'react';

type Indicator = { country: 'KR' | 'US'; label: string; value: string; unit: string; date: string | null; change: number | null };

function Row({ it }: { it: Indicator }) {
  const up = it.change != null && it.change > 0;
  const down = it.change != null && it.change < 0;
  return (
    <div className="flex items-center justify-between border-b border-unjong-border py-2 last:border-0">
      <span className="min-w-0 flex-1 truncate pr-2 text-[13px] text-unjong-primary">{it.label}</span>
      <span className="shrink-0 text-right">
        <span className="text-sm font-semibold text-unjong-primary">{it.value}</span>
        {it.unit ? <span className="ml-0.5 text-[11px] text-unjong-muted">{it.unit}</span> : null}
        {it.change != null ? (
          <span className={`ml-1 text-[11px] ${up ? 'text-red-500' : down ? 'text-blue-500' : 'text-unjong-muted'}`}>
            {up ? '▲' : down ? '▼' : ''}{Math.abs(it.change)}
          </span>
        ) : null}
      </span>
    </div>
  );
}

export default function MacroFeed() {
  const [kr, setKr] = useState<Indicator[]>([]);
  const [us, setUs] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/macro/summary')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { setKr(j.kr ?? []); setUs(j.us ?? []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p className="py-10 text-center text-sm text-unjong-muted">지표 불러오는 중…</p>;
  if (kr.length === 0 && us.length === 0) return <p className="py-10 text-center text-sm text-unjong-muted">지표를 불러오지 못했습니다.</p>;

  return (
    <div>
      {kr.length > 0 ? (
        <>
          <p className="mb-1 text-sm font-bold text-unjong-primary">🇰🇷 한국 지표</p>
          <div className="mb-4">{kr.map((it, i) => <Row key={`kr${i}`} it={it} />)}</div>
        </>
      ) : null}
      {us.length > 0 ? (
        <>
          <p className="mb-1 text-sm font-bold text-unjong-primary">🇺🇸 미국 지표</p>
          <div>{us.map((it, i) => <Row key={`us${i}`} it={it} />)}</div>
        </>
      ) : null}
      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">출처: 한국은행 ECOS · 미국 FRED. 발표 주기에 따라 갱신됩니다.</p>
    </div>
  );
}
