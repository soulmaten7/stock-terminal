<!-- 2026-07-08 (3rd) -->
# STEP 663E — 📱 모바일 하단 시트에 렌즈 미리보기(compact)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** HEAD `01a6f8d`(STEP 663B). 데스크탑 6개 보드 = 우측 `aside`에 `<LensPreview>`. **모바일 하단 시트엔 미적용**(수익률+"AI 렌즈" 버튼만·렌즈/브리핑 없음).
**목표:** 모바일 시트에도 데스크탑과 **동일한 렌즈+브리핑 미리보기**를 넣는다. 시트엔 이미 헤더+수익률이 있으니, `LensPreview`에 **`compact` 모드(헤더·수익률 생략)**를 추가해 중복 없이 "AI 렌즈" 버튼 자리에 끼운다.
**대상:** `LensPreview.tsx` + 6개 보드(MarketBoard·Us·Jp·Cn·Vn·Gb)의 모바일 시트.

---

## 1. `components/toolbox/LensPreview.tsx` — `compact` prop 추가
헤더(로고/이름/현재가)와 기간 수익률 블록은 **시트가 이미 보여주므로** compact일 때 생략. 렌즈+브리핑+CTA만 렌더.

```tsx
export default function LensPreview({ stock, market, compact = false }: { stock: LensRow | null; market: string; compact?: boolean }) {
  // ... (기존 상태·effect 그대로) ...

  if (!stock) {
    // compact면 빈 상태도 생략(시트는 종목 있을 때만 열림)
    if (compact) return null;
    return ( /* 기존 빈 상태 카드 그대로 */ );
  }
  return (
    <div className={compact ? '' : 'rounded-2xl border border-unjong-border bg-white p-4'}>
      {!compact && (
        <>
          {/* 헤더(로고/이름/현재가) 블록 — 기존 그대로 */}
          {/* 기간 수익률 grid 블록 — 기존 그대로 */}
        </>
      )}
      {/* AI 렌즈 블록 — 기존 그대로 (compact·full 공통) */}
      {/* R2 브리핑 블록 — 기존 그대로 (공통) */}
      {/* CTA Link — 기존 그대로 (공통) */}
    </div>
  );
}
```
> 즉 `!compact &&`로 **헤더+수익률만 감싸고**, 렌즈·브리핑·CTA는 공통. compact일 땐 바깥 카드 테두리도 뺌(시트 안이라).

## 2. 6개 보드 모바일 시트 — "AI 렌즈" 버튼 → `<LensPreview compact>`
각 보드의 모바일 시트 안(수익률 그리드 다음)에 있는 **"AI 렌즈" 링크 버튼**:
```tsx
<a href={`/stock/${selectedStock.symbol}`} className="... py-2.5 ...">
  <TLensLogo size={16} color="#2DD4BF" /> AI 렌즈
</a>
```
→ 아래로 교체:
```tsx
<LensPreview stock={selectedStock} market="{그 보드 값}" compact />
```
- `market` = 각 보드가 데스크탑 aside `<LensPreview>`에 넘기는 값과 동일(KR/US/JP/{curCode}/VN/GB).
- `LensPreview` import는 663B에서 이미 추가됨.
- 시트의 헤더(로고/이름/현재가)와 수익률 그리드는 **그대로 유지**(compact가 그 부분을 렌더 안 하니 중복 없음). CTA는 compact LensPreview 안의 "전체 렌즈·근거 보기 →"(Next Link)가 대신함.

> 시트는 selectedStock 있을 때만 열리므로 compact 미선택 빈상태(null)는 안 뜸.

---

## 3. 검증 → 커밋
```bash
npx tsc --noEmit          # EXIT 0
```
- 모바일(반응형/실기기)에서 6개 국가 탭: 종목 카드 탭 → 하단 시트에 **헤더+수익률(기존) + 렌즈 읽기 + (0.7초 후)브리핑 + "전체 렌즈 보기"** 표시. 데스크탑 레일과 동일 내용.
- 시트 위로 끌어 66vh 확장 시 렌즈+브리핑까지 스크롤로 다 보이는지.
- 데스크탑은 회귀 없이 그대로.
- console.log 금지.
```bash
git add components/toolbox/LensPreview.tsx components/toolbox/MarketBoard.tsx components/toolbox/UsMarketBoard.tsx components/toolbox/JpMarketBoard.tsx components/toolbox/CnMarketBoard.tsx components/toolbox/VnMarketBoard.tsx components/toolbox/GbMarketBoard.tsx
git commit -m "feat(ui): STEP 663E 모바일 하단 시트에 렌즈 미리보기(LensPreview compact) — PC 레일과 동일(렌즈+브리핑), 6개 보드"
git push
```

## Cowork에게 보고
- 모바일 시트에 렌즈+브리핑 뜨는지(6개 탭) + 시트 스크롤/확장 정상 + 데스크탑 회귀 없음.
→ 다음 = STEP 664(광고 슬롯 유료-only) → 광고 대화.
