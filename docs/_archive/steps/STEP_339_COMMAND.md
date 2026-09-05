<!-- 2026-06-21 -->
# STEP 339 — [UI] 거시경제 피드: 한국/미국 토글 + 박스형

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_339_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
거시경제 우측 피드에서 한국·미국 지표가 쌓여 보이던 걸 → **🇰🇷한국 / 🇺🇸미국 토글 + 박스형**으로. 한 번에 한 나라만 박스 안에서 보기.

> 변경 1파일: `components/toolbox/MacroFeed.tsx` **전체 교체**. API·배선 변경 없음.

---

## 📄 `components/toolbox/MacroFeed.tsx` — 아래 내용으로 **전체 교체**

```tsx
'use client';

import { useEffect, useState } from 'react';

type Indicator = { country: 'KR' | 'US'; label: string; value: string; unit: string; date: string | null; change: number | null };

function Row({ it }: { it: Indicator }) {
  const up = it.change != null && it.change > 0;
  const down = it.change != null && it.change < 0;
  return (
    <div className="flex items-center justify-between border-b border-unjong-border py-2.5 last:border-0">
      <span className="min-w-0 flex-1 truncate pr-2 text-[13px] text-unjong-primary">{it.label}</span>
      <span className="shrink-0 text-right">
        <span className="text-sm font-semibold text-unjong-primary">{it.value}</span>
        {it.unit ? <span className="ml-0.5 text-[10px] text-unjong-muted">{it.unit}</span> : null}
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
  const [view, setView] = useState<'kr' | 'us'>('kr');

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

  const list = view === 'kr' ? kr : us;

  return (
    <div>
      <p className="mb-2 text-sm font-bold text-unjong-primary">주요 경제지표</p>

      {/* 한국/미국 토글 */}
      <div className="mb-2 flex gap-1">
        <button
          type="button"
          onClick={() => setView('kr')}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            view === 'kr' ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
          }`}
        >
          🇰🇷 한국
        </button>
        <button
          type="button"
          onClick={() => setView('us')}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
            view === 'us' ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
          }`}
        >
          🇺🇸 미국
        </button>
      </div>

      {/* 박스 */}
      <div className="rounded-xl border border-unjong-border bg-unjong-surface px-3">
        {list.length > 0 ? (
          list.map((it, i) => <Row key={`${view}${i}`} it={it} />)
        ) : (
          <p className="py-8 text-center text-sm text-unjong-muted">데이터 없음</p>
        )}
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-unjong-muted">출처: 한국은행 ECOS · 미국 FRED. 발표 주기에 따라 갱신됩니다.</p>
    </div>
  );
}
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

개발 서버(HMR로 반영, 안 되면 새로고침):
1. **거시경제 탭** → 우측 상단 **🇰🇷한국 / 🇺🇸미국 토글**, 아래 박스에 선택한 나라 지표.
2. 한국 기본 표시 → 미국 클릭 시 미국 지표로 전환.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add components/toolbox/MacroFeed.tsx && git commit -m "ui(macro): 거시경제 피드 한국/미국 토글 + 박스형 (STEP 339)" && git push
```

---

> **한 줄 요약**: 거시경제 지표를 한국/미국 토글 박스로 분리 — 한 번에 한 나라만 깔끔하게.
