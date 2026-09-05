<!-- 2026-07-08 (3rd) -->
# STEP 663B — 🔬 LensPreview 공유 추출 + 6개 보드 미러 (+브리핑·Next Link)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** HEAD `aec1be6`(STEP 663D 이후). KR `MarketBoard.tsx`는 이미 인라인 `LensPreview`(렌즈+수익률) 사용 중. 나머지 5개 보드는 아직 증권사 사이드바.
**목표:** ① KR의 `LensPreview`를 **공유 컴포넌트**로 추출하고 **R2 브리핑(디바운스)+Next Link**를 얹는다. ② US·JP·CN·VN·GB 5개 보드도 KR과 동일하게 우측 레일=LensPreview로 교체(증권사 사이드바 제거). → **6개 보드 전부 미러 완료.**
**이 STEP이 STEP 663C를 대체함**(브리핑을 여기서 공유 컴포넌트에 포함 → `docs/STEP_663C_*`는 실행하지 말 것).

> ⚠️ 큰 STEP(7파일). **보드 하나씩 고치고 매번 `npx tsc --noEmit`** 로 확인하며 진행. 5개 보드 변환은 **STEP 663이 KR에 한 것과 동일**(git `a7fccef` 참고 가능).

---

## 1. `components/toolbox/LensPreview.tsx` 신설 (KR 것 이동 + 3가지 추가)

**KR `MarketBoard.tsx`의 현재 `LensPreview` 함수(59~137행)와 `LensItem` 타입을 이 파일로 이동**한 뒤 아래 3가지만 수정. 의존 헬퍼 `pct`·`pctColor`·`gradeBadgeClass`가 MarketBoard에만 있으면 **이 파일로 함께 이동(또는 `lib/`로 빼서 공유)** — LensPreview.tsx가 자급되게.

```tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';                       // (추가2) a → Link
import { Sparkles } from 'lucide-react';            // (추가1) 브리핑 아이콘
import { StockLogo } from '@/components/ui/StockLogo';
import { TLensLogo } from '@/components/AiLensBadge';
import { formatPrice } from '@/lib/currency';
// pct·pctColor·gradeBadgeClass = MarketBoard에서 이동해 여기 정의(또는 lib 공유)

type LensItem = { key: string; name: string; grade: string; gradeTier: string; verdict?: { phrase: string; tone: string } | null };
// 보드 공통 최소 필드
export type LensRow = { symbol: string; name: string; price?: number | null; changePercent?: number | null; r1w?: number | null; r1m?: number | null; r3m?: number | null; r6m?: number | null; r1y?: number | null };

export default function LensPreview({ stock, market }: { stock: LensRow | null; market: string }) {
  const [lenses, setLenses] = useState<LensItem[] | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  // (추가3) R2 브리핑 — 디바운스(선택 700ms 유지 시만 LLM 로드)
  const [brief, setBrief] = useState('');
  const [briefState, setBriefState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {                                  // 렌즈 (즉시)
    if (!stock) { setState('idle'); setLenses(null); return; }
    let alive = true; setState('loading');
    fetch('/api/lens?symbol=' + encodeURIComponent(stock.symbol))
      .then((r) => r.json())
      .then((j) => { if (!alive) return; setLenses(j.lenses || []); setState('done'); })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [stock?.symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {                                  // 브리핑 (디바운스 700ms)
    if (!stock) { setBriefState('idle'); setBrief(''); return; }
    let alive = true; setBriefState('idle');
    const t = setTimeout(() => {
      setBriefState('loading');
      fetch('/api/brief?symbol=' + encodeURIComponent(stock.symbol))
        .then((r) => r.json())
        .then((j) => { if (!alive) return; if (j.brief) { setBrief(j.brief); setBriefState('done'); } else setBriefState('error'); })
        .catch(() => { if (alive) setBriefState('error'); });
    }, 700);
    return () => { alive = false; clearTimeout(t); };
  }, [stock?.symbol]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stock) {
    return (
      <div className="rounded-2xl border border-unjong-border bg-white p-4 text-center">
        <TLensLogo size={22} color="#2DD4BF" />
        <p className="mt-2 text-sm font-semibold text-unjong-primary">종목을 선택하면 AI 렌즈가 읽어드려요</p>
        <p className="mt-1 text-[12px] leading-relaxed text-unjong-muted">검증된 기법들이 이 종목을 어떻게 보는지 요약해요.</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-unjong-border bg-white p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2.5">
        <StockLogo code={stock.symbol} name={stock.name} size={32} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-unjong-primary">{stock.name}</p>
          <p className="text-[12px] tabular-nums text-unjong-muted">{stock.price ? formatPrice(stock.price, market) : '—'}</p>
        </div>
      </div>
      {/* 기간 수익률 */}
      <div className="mt-3 grid grid-cols-3 gap-y-2">
        {([['1일',stock.changePercent],['1주',stock.r1w],['1개월',stock.r1m],['3개월',stock.r3m],['6개월',stock.r6m],['1년',stock.r1y]] as [string, number|null|undefined][]).map(([l,v]) => (
          <div key={l} className="flex flex-col"><span className="text-[11px] text-unjong-muted">{l}</span><span className={`text-sm font-semibold tabular-nums ${pctColor(v)}`}>{pct(v)}</span></div>
        ))}
      </div>
      {/* AI 렌즈 (KR 것 그대로 — l.name·verdict.phrase·gradeBadgeClass(l.gradeTier)·l.grade) */}
      <div className="mt-3 border-t border-unjong-border pt-3">
        <div className="mb-1.5 flex items-center gap-1"><TLensLogo size={12} color="#2DD4BF" /><span className="text-[12px] font-semibold text-unjong-primary">AI 렌즈</span></div>
        {state === 'loading' ? <p className="text-[12px] text-unjong-muted">렌즈 읽는 중…</p>
          : state === 'done' && lenses?.length ? (
            <ul className="space-y-1">{lenses.map((l) => (
              <li key={l.key} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="text-unjong-primary">{l.name}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {l.verdict?.phrase ? <span className={`font-medium ${l.verdict.tone === 'pos' ? 'text-unjong-accent' : l.verdict.tone === 'warn' ? 'text-amber-600' : 'text-unjong-muted'}`}>{l.verdict.phrase}</span> : null}
                  <span className={`rounded px-1 py-0.5 text-[10px] font-medium ${gradeBadgeClass(l.gradeTier)}`}>{l.grade}</span>
                </span>
              </li>))}</ul>
          ) : <p className="text-[12px] text-unjong-muted">렌즈 정보 준비 중</p>}
      </div>
      {/* R2 브리핑 (디바운스·idle/error엔 숨김) */}
      {briefState !== 'idle' && briefState !== 'error' && (
        <div className="mt-3 border-t border-unjong-border pt-3">
          <div className="mb-1.5 flex items-center gap-1"><Sparkles size={12} className="text-unjong-accent" /><span className="text-[12px] font-semibold text-unjong-accent">이 종목 브리핑</span><span className="ml-auto text-[10px] text-unjong-muted">AI · 사실만</span></div>
          {briefState === 'loading' ? <p className="text-[12px] text-unjong-muted">브리핑 만드는 중…</p> : <p className="text-[12px] leading-relaxed text-unjong-primary">{brief}</p>}
        </div>
      )}
      {/* CTA — Next Link(잔상·풀리로드 방지) */}
      <Link href={`/stock/${stock.symbol}`} className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-unjong-accent/10 py-2 text-[12px] font-semibold text-unjong-accent hover:bg-unjong-accent/15">전체 렌즈·근거 보기 →</Link>
    </div>
  );
}
```

## 2. KR `MarketBoard.tsx` — 공유 컴포넌트로 전환
- 인라인 `LensPreview` 함수(59~137)·`LensItem` 타입(59) **삭제**. `pct`/`pctColor`/`gradeBadgeClass`가 LensPreview로 이동됐으면 MarketBoard에서 여전히 쓰는 곳이 있는지 확인 후(표 셀 등) — 쓰면 `lib` 공유로 빼거나 MarketBoard에도 유지. **표 셀에서도 쓰므로 `pct`·`pctColor`는 `lib/format`류로 공유 추천**(둘 다 import).
- 상단 `import LensPreview from './LensPreview';`.
- 사용처(현 599행) `<LensPreview stock={selectedStock} />` → `<LensPreview stock={selectedStock} market="KR" />`.
- `npx tsc --noEmit` 통과 확인.

## 3. US·JP·CN·VN·GB 5개 보드 — KR과 동일 변환 (STEP 663이 KR에 한 것 반복)
각 보드(`UsMarketBoard`·`JpMarketBoard`·`CnMarketBoard`·`VnMarketBoard`·`GbMarketBoard`)에 대해:
1. **컨트롤 줄 우측 "증권사 바로가기" 헤더 제거**(각 보드 ~199~261행의 `<p>증권사 바로가기</p>` 및 그 헤더 컨테이너).
2. **데스크탑 사이드바 `<aside w-72><BrokerRanking hideHeader/></aside>`(~413~535행) → `<aside className="hidden w-96 shrink-0 lg:block"><LensPreview stock={selectedStock} market="{그 보드 값}" /></aside>`**.
   - `market` = 그 보드가 표 셀에서 `formatPrice(price, ??)`에 넘기는 값 그대로(US/JP/CN/VN/GB 각각).
3. **모바일 증권사 섹션(`<p>증권사 바로가기</p>`+`<BrokerRanking hideHeader/>` ~458~590행) 제거.**
4. **인라인 수익률 패노라마(행 클릭 시 펼쳐지는 `<tr>`)가 있으면 제거**(KR 663과 동일 — 수익률이 LensPreview로 감).
5. `import LensPreview from './LensPreview';` 추가, `import BrokerRanking ...` **제거**.
6. `selectedStock` 상태·행 클릭 `selectStock`은 그대로(이미 있음 — 시트/패노라마용).
7. **보드 하나 끝낼 때마다 `npx tsc --noEmit`.**

> 각 보드 구조는 KR과 미러라 위치만 다름. 헷갈리면 `git show a7fccef -- components/toolbox/MarketBoard.tsx`로 KR 변환 diff 참고.

## 4. 검증 → 커밋
```bash
npx tsc --noEmit          # EXIT 0
```
- 6개 국가 탭 전부: 종목 클릭 → 우측에 렌즈+수익률+(0.7초 후)브리핑 + "전체 렌즈 보기"(Next Link). 증권사 사이드바 사라짐(증권사 탭엔 있음). "전체 렌즈 보기" 클릭→종목 페이지→뒤로 시 **잔상 없이 매끄럽게**.
- 데스크탑/모바일 다 확인. console.log 금지.
```bash
git add components/toolbox/LensPreview.tsx components/toolbox/MarketBoard.tsx components/toolbox/UsMarketBoard.tsx components/toolbox/JpMarketBoard.tsx components/toolbox/CnMarketBoard.tsx components/toolbox/VnMarketBoard.tsx components/toolbox/GbMarketBoard.tsx
git commit -m "feat(ui): STEP 663B LensPreview 공유 추출+브리핑(디바운스)+Next Link, 6개 보드 우측 레일 미러(증권사 사이드바 전면 제거)"
git push
```

## Cowork에게 보고
1. 6개 탭 전부 렌즈 미리보기+브리핑 정상 + 증권사 사이드바 완전 제거 확인.
2. 잔상(뒤로가기) 해소 여부.
3. 각 보드 market 값(formatPrice) 맞는지(통화 표기).
→ 다음 = **STEP 664**(광고 슬롯 유료-only + 빈 상태 접기). 그 후 광고 대화.
