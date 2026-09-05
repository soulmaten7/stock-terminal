<!-- 2026-06-27 -->
# STEP 422 — 리딩방 모바일 시트: X 제거 → 바깥 터치 + 아래로 드래그로 닫기

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_422_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
모바일에서 리딩방을 누르면 뜨는 **하단 시트**의 닫기 방식을 자연스럽게 바꾼다.
- **지금**: 우측 상단 **X 버튼**으로만 닫힘 → 바로 아래 즐겨찾기(별) 아이콘과 붙어 **겹쳐 보임**. 어두운 배경을 눌러도 안 닫힘.
- **바꿈**: ① **X 제거** ② **어두운 배경(바깥) 터치 → 닫힘** ③ 시트 위 **회색 핸들 바를 잡고 아래로 내리면 닫힘**(토스·당근 같은 표준 바텀시트). → 겹침 해소 + 더 자연스러운 UX.

## 전제
- 최신 main. **컴포넌트 1개(`components/toolbox/AdvisorDirectory.tsx`)만 수정 → HMR로 즉시 반영**(dev 서버 켜져 있으면 localhost:3333에서 바로 보임).
- **빌드·커밋은 이 STEP에서 하지 않음**(보류). 사용자가 화면에서 확인한 뒤 다음 변경과 묶어서 커밋할 예정. → dev 서버 끄지 말 것(`pkill` 금지).
- 데스크탑(우측 사이드바 미리보기)은 그대로 — 이 변경은 모바일 전용 시트(`lg:hidden`)만 건드림.

---

## `components/toolbox/AdvisorDirectory.tsx` — 3곳 수정

### (1) import — `useRef` + 터치 이벤트 타입 추가
**찾기:**
```tsx
import { useEffect, useState } from 'react';
```
**바꾸기:**
```tsx
import { useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react';
```

### (2) 드래그 상태 + 핸들러 추가 (`registering` 상태 바로 아래)
**찾기:**
```tsx
  const [registering, setRegistering] = useState(false);
```
**바꾸기:**
```tsx
  const [registering, setRegistering] = useState(false);

  // 모바일 하단 시트: 핸들을 잡고 아래로 드래그하면 닫힘
  const [sheetDragY, setSheetDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);
  function onSheetTouchStart(e: ReactTouchEvent) {
    dragStartY.current = e.touches[0].clientY;
  }
  function onSheetTouchMove(e: ReactTouchEvent) {
    if (dragStartY.current === null) return;
    setSheetDragY(Math.max(0, e.touches[0].clientY - dragStartY.current)); // 아래로만
  }
  function onSheetTouchEnd() {
    if (sheetDragY > 90) setSelected(null); // 충분히 내리면 닫기
    setSheetDragY(0);                        // 아니면 제자리로 스냅백
    dragStartY.current = null;
  }
```

### (3) 모바일 하단 시트 JSX 교체 (X 제거 + 배경 터치 + 드래그 핸들)
**찾기:**
```tsx
      {/* 미리보기 (모바일 하단 시트) */}
      {selected ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40 lg:hidden">
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border-t border-unjong-border bg-unjong-surface p-3 sm:p-4">
            <div className="mb-1 flex justify-end">
              <button type="button" onClick={() => setSelected(null)} aria-label="닫기" className="text-unjong-muted hover:text-unjong-primary">
                <X size={18} />
              </button>
            </div>
            <PreviewBody a={selected} onReport={() => openReport(selected)} isFav={favs.has(selected.biz_no)} onToggleFav={() => toggleFav(selected)} />
          </div>
        </div>
      ) : null}
```
**바꾸기:**
```tsx
      {/* 미리보기 (모바일 하단 시트 — 바깥 터치 또는 아래로 드래그하면 닫힘) */}
      {selected ? (
        <div
          className="fixed inset-0 z-40 flex items-end bg-black/40 lg:hidden"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border-t border-unjong-border bg-unjong-surface pb-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: `translateY(${sheetDragY}px)`,
              transition: sheetDragY ? 'none' : 'transform 0.2s ease',
            }}
          >
            {/* 드래그 핸들 — 잡고 아래로 내리면 닫힘 */}
            <div
              className="flex cursor-grab touch-none justify-center px-3 pb-2 pt-3 active:cursor-grabbing"
              onTouchStart={onSheetTouchStart}
              onTouchMove={onSheetTouchMove}
              onTouchEnd={onSheetTouchEnd}
            >
              <span className="h-1.5 w-10 rounded-full bg-unjong-border" />
            </div>
            <div className="px-3 sm:px-4">
              <PreviewBody a={selected} onReport={() => openReport(selected)} isFav={favs.has(selected.biz_no)} onToggleFav={() => toggleFav(selected)} />
            </div>
          </div>
        </div>
      ) : null}
```

> ⚠️ `X` import는 **지우지 말 것** — 아래 '신고 모달'에서 계속 사용 중.

## 빌드·커밋
- **하지 않음(보류).** 컴포넌트 1개라 HMR로 바로 반영됨. 사용자가 localhost:3333 모바일 화면에서 확인 후 다음 변경과 묶어서 커밋.
- 끝나면 `git status -sb`로 `AdvisorDirectory.tsx`만 변경됐는지 확인하고 보고.

## 확인 (모바일 폭 / 실폰)
- 리딩방 클릭 → 하단 시트 **맨 위에 회색 핸들 바** 표시, X 버튼 없음.
- **핸들 잡고 아래로 쭉 내리면 닫힘**(살짝 내렸다 놓으면 제자리로 복귀).
- 시트 **바깥(어두운 영역) 터치 → 닫힘**.
- 즐겨찾기(별) 아이콘과 닫기 버튼 **겹침 사라짐**(X 자체가 없어짐).
- 시트 안에서 별·신고·바로가기 누르면 **닫히지 않고** 각 동작만 됨.
- 데스크탑(넓은 화면)은 우측 사이드바 그대로.
