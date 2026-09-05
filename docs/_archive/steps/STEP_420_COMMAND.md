<!-- 2026-06-26 -->
# STEP 420 — 기간 선택 커스텀 드롭다운 (네이티브 select 교체)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_420_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
국내(`MarketBoard`)·미국(`UsMarketBoard`) 종목표 헤더의 기간 선택 **네이티브 `<select>`**를 **커스텀 드롭다운**으로 교체한다. 버튼(현재 기간 라벨 + chevron) 클릭 → 바로 아래 `absolute z-50 mt-1` 작은 팝업이 기간 옵션을 나열, 옵션 클릭 시 해당 기간 설정 + 닫힘, 바깥 클릭 시 닫힘(`ref` + `mousedown` 리스너 — 기존 `SelectDropdown.tsx` 패턴 미러).

> **UI 교체만**. 선택 시 정렬(`setSortKey`/`setSortDir('desc')`)·기간 셀 표시값·옆 정렬 화살표 토글은 **동일하게 유지**. 표는 `overflow-x-auto`로 잘릴 수 있으니 팝업을 **작게·우측 정렬**해 보이도록 한다.

> 변경 2파일: `components/toolbox/MarketBoard.tsx`, `components/toolbox/UsMarketBoard.tsx`. 컴포넌트만 → **새로고침이면 충분**.

---

## 📋 전제 상태
- **STEP 419 반영 후** 진행(419 편집 영역 = 모바일 증권사 섹션 / 클릭 시트 / `ListRow`. 본 STEP 편집 영역 = 기간 `<select>` + 상태/훅 블록 → **겹치지 않음**).
- 기존 `SelectDropdown.tsx`(STEP 310)는 `w-full` + `left-0 right-0` 풀폭 구조라 좁은 표 헤더엔 부적합 → **소형 인라인 드롭다운**을 각 보드에 직접 구현(스타일은 기존 `<select>`와 동일 톤 유지). `lucide-react`의 `ChevronDown`은 이미 두 파일에 import됨.
- 국내 상태명 `mobilePeriod`, 미국 상태명 `period`. 옵션 = 국내 `DROPDOWN_PERIODS`(=`PERIODS`), 미국 `PERIODS`.

---

## 📄 파일 1 — `components/toolbox/MarketBoard.tsx` (국내)

### 1-1) `useRef` import 추가
**찾기:**
```tsx
import { useEffect, useMemo, useState } from 'react';
```
**바꾸기:**
```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
```

### 1-2) 드롭다운 open 상태 + ref + 바깥 클릭 닫기 effect 추가
**찾기:**
```tsx
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
```
**바꾸기:**
```tsx
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [periodOpen, setPeriodOpen] = useState(false); // 기간 커스텀 드롭다운 열림
  const periodRef = useRef<HTMLDivElement>(null);

  // 기간 드롭다운 바깥 클릭 시 닫기 (SelectDropdown 패턴 미러)
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
```

### 1-3) 네이티브 `<select>` → 커스텀 드롭다운 버튼 + 팝업
**찾기:**
```tsx
                      <select value={mobilePeriod} onChange={(e) => { const k = e.target.value as PeriodKey; setMobilePeriod(k); setSortKey(k); setSortDir('desc'); setPage(0); }} className="rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none">
                        {DROPDOWN_PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
```
**바꾸기:**
```tsx
                      <div ref={periodRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setPeriodOpen((o) => !o)}
                          aria-haspopup="listbox"
                          aria-expanded={periodOpen}
                          className="flex items-center gap-1 rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none hover:border-unjong-accent"
                        >
                          {DROPDOWN_PERIODS.find((p) => p.key === mobilePeriod)?.label ?? '기간'}
                          <ChevronDown size={12} className={`shrink-0 text-unjong-muted transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {periodOpen ? (
                          <div role="listbox" className="absolute right-0 top-full z-50 mt-1 min-w-[5rem] overflow-hidden rounded-lg border border-unjong-border bg-unjong-surface py-1 text-left shadow-lg">
                            {DROPDOWN_PERIODS.map((p) => (
                              <button
                                key={p.key}
                                type="button"
                                role="option"
                                aria-selected={p.key === mobilePeriod}
                                onClick={() => { setMobilePeriod(p.key); setSortKey(p.key); setSortDir('desc'); setPage(0); setPeriodOpen(false); }}
                                className={`block w-full px-3 py-1.5 text-right text-xs transition-colors hover:bg-unjong-background ${p.key === mobilePeriod ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
```

---

## 📄 파일 2 — `components/toolbox/UsMarketBoard.tsx` (미국)

### 2-1) `useRef` import 추가
**찾기:**
```tsx
import { useEffect, useMemo, useState } from 'react';
```
**바꾸기:**
```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
```

### 2-2) 드롭다운 open 상태 + ref + 바깥 클릭 닫기 effect 추가
**찾기:**
```tsx
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
```
**바꾸기:**
```tsx
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [periodOpen, setPeriodOpen] = useState(false); // 기간 커스텀 드롭다운 열림
  const periodRef = useRef<HTMLDivElement>(null);

  // 기간 드롭다운 바깥 클릭 시 닫기 (SelectDropdown 패턴 미러) — KR 미러
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) setPeriodOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
```

### 2-3) 네이티브 `<select>` → 커스텀 드롭다운 버튼 + 팝업
**찾기:**
```tsx
                      <select value={period} onChange={(e) => { const k = e.target.value as PeriodKey; setPeriod(k); setSortKey(k); setSortDir('desc'); setPage(0); }} className="rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none">
                        {PERIODS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                      </select>
```
**바꾸기:**
```tsx
                      <div ref={periodRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setPeriodOpen((o) => !o)}
                          aria-haspopup="listbox"
                          aria-expanded={periodOpen}
                          className="flex items-center gap-1 rounded border border-unjong-border bg-unjong-surface px-1.5 py-1 text-xs font-medium text-unjong-primary outline-none hover:border-unjong-accent"
                        >
                          {PERIODS.find((p) => p.key === period)?.label ?? '기간'}
                          <ChevronDown size={12} className={`shrink-0 text-unjong-muted transition-transform ${periodOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {periodOpen ? (
                          <div role="listbox" className="absolute right-0 top-full z-50 mt-1 min-w-[5rem] overflow-hidden rounded-lg border border-unjong-border bg-unjong-surface py-1 text-left shadow-lg">
                            {PERIODS.map((p) => (
                              <button
                                key={p.key}
                                type="button"
                                role="option"
                                aria-selected={p.key === period}
                                onClick={() => { setPeriod(p.key); setSortKey(p.key); setSortDir('desc'); setPage(0); setPeriodOpen(false); }}
                                className={`block w-full px-3 py-1.5 text-right text-xs transition-colors hover:bg-unjong-background ${p.key === period ? 'font-bold text-unjong-accent' : 'text-unjong-primary'}`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
```

---

## ✅ 검증
```bash
pkill -f "next dev" 2>/dev/null; npm run build
```
빌드 무에러.

개발 서버(컴포넌트 → HMR/새로고침), 국내·미국 종목표:
1. 기간 헤더가 **버튼(현재 기간 + chevron)** 으로 보임 — 기존 select 톤과 동일.
2. 클릭 → **아래 작은 팝업**에 1일·1주일·1개월·3개월·6개월·1년 나열, 현재 선택값은 accent 강조.
3. 옵션 클릭 → 해당 기간으로 **셀 값 갱신 + 그 기간 내림차순 정렬** + 팝업 닫힘(기존 동작 동일).
4. 팝업 **바깥 클릭/다른 곳 클릭 → 닫힘**.
5. 팝업이 우측 정렬(`right-0`)이라 표 `overflow-x-auto`에 잘리지 않고 보임.
6. 옆 **정렬 화살표 토글**·정렬·기간 표시값은 이전과 **변동 없음**.

---

## 📦 커밋 (LOCAL only — push·vercel 금지)
```bash
cd ~/stock-terminal && git add components/toolbox/MarketBoard.tsx components/toolbox/UsMarketBoard.tsx && git commit -m "feat(STEP 420): 기간 선택 커스텀 드롭다운 — 네이티브 select 교체"
```
> push 하지 말 것. vercel 배포 하지 말 것. 로컬 커밋까지만.

---

## ⏭️ 스킵 / 보류
- 정렬 로직·기간 셀 값·정렬 화살표는 **불변**(UI 스왑만).
- 데스크탑/모바일 동일 컴포넌트라 두 환경 모두 커스텀 드롭다운 적용(별도 분기 없음).
- 기존 `SelectDropdown.tsx`는 풀폭 전용이라 표 헤더엔 미사용 — 손대지 않음.

> **한 줄 요약**: 기간 네이티브 `<select>` → 우측 정렬 소형 커스텀 드롭다운(ref+mousedown 바깥클릭). 정렬·기간값 로직 그대로, UI만 교체.
