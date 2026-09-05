<!-- 2026-06-27 -->
# STEP 423 — 종목(주식/ETF) 모바일 시트도 X 제거 + 드래그로 닫기 (리딩방과 통일)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_423_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
STEP 422에서 리딩방 시트를 "바깥 터치 + 아래로 드래그"로 바꿨다. **종목(주식/ETF) 클릭 시 뜨는 모바일 시트도 동일하게** 통일한다.
- 종목 시트는 **바깥(어두운 배경) 터치 닫기는 이미 동작**(backdrop `onClick` 있음). → **X 버튼만 제거 + 위쪽 드래그 핸들 추가**.
- KR(`MarketBoard.tsx`)·US(`UsMarketBoard.tsx`) **두 파일 모두** 동일하게 수정(시트 구조가 미러라 find/replace가 양쪽 동일).
- `X` 아이콘은 두 파일에서 이 시트 닫기 버튼 **한 곳에만** 쓰임 → 제거 후 lucide import에서도 `X` 빼야 함(미사용 경고/빌드 에러 방지).

## 전제
- 최신 main + STEP 422 적용 상태. **컴포넌트 2개만 수정 → HMR 즉시 반영**(localhost:3333에서 모바일 폭으로 바로 확인).
- **빌드·커밋은 이 STEP에서 하지 않음(보류)** — 사용자가 화면 확인 후 다음에 묶어서 커밋. dev 서버 끄지 말 것(`pkill` 금지).
- 데스크탑(우측 증권사 사이드바)은 그대로 — 모바일 시트(`lg:hidden`)만 변경.

---

## ⚠️ 적용 방법 — 아래 5개 수정을 **두 파일에 똑같이** 적용
대상: `components/toolbox/MarketBoard.tsx` **그리고** `components/toolbox/UsMarketBoard.tsx`
(두 파일의 해당 줄이 완전히 동일하므로, 같은 find/replace를 각 파일에 적용하면 된다.)

### (1) import — 터치 이벤트 타입 추가
**찾기:**
```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
```
**바꾸기:**
```tsx
import { useEffect, useMemo, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
```

### (2) import — 안 쓰는 `X` 아이콘 제거
**찾기:**
```tsx
import { Star, X, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
```
**바꾸기:**
```tsx
import { Star, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
```

### (3) 드래그 상태 + 핸들러 추가 (`selectedStock` 선언 바로 아래)
**찾기:**
```tsx
  const [selectedStock, setSelectedStock] = useState<Row | null>(null);
```
**바꾸기:**
```tsx
  const [selectedStock, setSelectedStock] = useState<Row | null>(null);

  // 모바일 하단 시트: 핸들을 잡고 아래로 드래그하면 닫힘 (리딩방 시트와 동일)
  const [sheetDragY, setSheetDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);
  function onSheetTouchStart(e: ReactTouchEvent) {
    dragStartY.current = e.touches[0].clientY;
  }
  function onSheetTouchMove(e: ReactTouchEvent) {
    if (dragStartY.current === null) return;
    setSheetDragY(Math.max(0, e.touches[0].clientY - dragStartY.current));
  }
  function onSheetTouchEnd() {
    if (sheetDragY > 90) setSelectedStock(null);
    setSheetDragY(0);
    dragStartY.current = null;
  }
```

### (4) 시트 div에 드래그 핸들 + translateY 추가
**찾기:**
```tsx
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-unjong-border bg-unjong-surface p-4 shadow-xl">
            <div className="mb-3 flex items-center gap-3">
```
**바꾸기:**
```tsx
          <div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-unjong-border bg-unjong-surface px-4 pb-4 pt-2 shadow-xl"
            style={{ transform: `translateY(${sheetDragY}px)`, transition: sheetDragY ? 'none' : 'transform 0.2s ease' }}
          >
            {/* 드래그 핸들 — 잡고 아래로 내리면 닫힘 (바깥 터치로도 닫힘) */}
            <div
              className="flex touch-none cursor-grab justify-center pb-3 pt-1 active:cursor-grabbing"
              onTouchStart={onSheetTouchStart}
              onTouchMove={onSheetTouchMove}
              onTouchEnd={onSheetTouchEnd}
            >
              <span className="h-1.5 w-10 rounded-full bg-unjong-border" />
            </div>
            <div className="mb-3 flex items-center gap-3">
```

### (5) X 닫기 버튼 제거
**찾기:**
```tsx
              </div>
              <button type="button" onClick={() => setSelectedStock(null)} aria-label="닫기" className="shrink-0 text-unjong-muted hover:text-unjong-primary">
                <X size={20} />
              </button>
            </div>
```
**바꾸기:**
```tsx
              </div>
            </div>
```

---

## 확인 (모바일 폭 / 실폰)
- '종목·상품' 탭(한국/미국 둘 다)에서 종목 클릭 → 시트 **맨 위에 회색 핸들 바**, X 버튼 없음.
- **핸들 잡고 아래로 내리면 닫힘**(살짝 내렸다 놓으면 제자리 복귀).
- 시트 **바깥(어두운 영역) 터치 → 닫힘**(원래 되던 동작 유지).
- 시트 안에서 스크롤·증권사 바로가기 정상.
- 데스크탑은 우측 증권사 사이드바 그대로.

## 빌드·커밋
- **하지 않음(보류).** 컴포넌트 2개라 HMR로 바로 반영. 확인 후 다음 변경과 묶어서 커밋.
- 끝나면 `git status -sb`로 `MarketBoard.tsx`·`UsMarketBoard.tsx`만 변경됐는지 확인하고 보고.
