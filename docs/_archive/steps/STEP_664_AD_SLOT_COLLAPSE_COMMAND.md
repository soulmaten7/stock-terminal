<!-- 2026-07-08 (3rd) -->
# STEP 664 — 📢 광고 슬롯 반복 CTA 정리(접기) · 종목 보드

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** HEAD `53db7fa`(STEP 663E). 
**목표:** 6개 종목 보드에서 **10행마다 반복 삽입되는 "광고 문의하기" CTA**를 제거하고, 리스트 **하단에 옅은 CTA 하나만** 남긴다. 광고주 0인 현재, 반복 CTA가 깨진 광고처럼 어수선한 걸 정리(정직화).
**범위:** 6개 보드(`MarketBoard`·`Us`·`Jp`·`Cn`·`Vn`·`Gb`)의 broker 슬롯만. (youtube·피드·리딩방·증권사탭의 AdSlotRow는 이번 범위 아님 — 진짜 광고 게재 모델과 함께 '광고 대화'에서.)

> ⚠️ **진짜 "유료 신청분만 표시"는 광고 데이터 모델(승인 광고 테이블+관리자 승인)이 있어야** 하고, 그건 결제·법률 전제(Phase 2a)라 이번엔 안 함. 이번 STEP = 반복 CTA 접기만.

---

## 각 보드(6개) 공통 변경
각 보드에 **broker 슬롯 삽입이 2군데**(데스크탑 표 `<tr>` + 모바일 카드 리스트) 있음. 예 — `MarketBoard.tsx`:
- 443~445행(데스크탑 표):
```tsx
{(i + 1) % 10 === 0 && i + 1 < paginated.length ? (
  <tr><td colSpan={6} className="p-0"><AdSlotRow slot="broker" /></td></tr>
) : null}
```
- 482행(모바일 리스트):
```tsx
{(i + 1) % 10 === 0 && i + 1 < paginated.length ? <AdSlotRow slot="broker" /> : null}
```

**두 삽입 다 삭제** (map 내부의 10행마다 반복 제거).

**대신 리스트 하단에 한 번만** — 표/모바일 리스트가 끝난 뒤(페이지네이션 근처, 반응형 공통 위치)에 옅게 하나:
```tsx
<div className="mt-2">
  <AdSlotRow slot="broker" />
</div>
```
> 위치: 데스크탑 표 + 모바일 카드 리스트를 감싸는 컨테이너의 **맨 아래**(페이지네이션 위 또는 아래) 한 곳. desktop/mobile 공통으로 한 번만 노출. `AdSlotRow` import는 유지(계속 씀).

### 각 보드 해당 라인(참고 — grep 기준)
- `MarketBoard.tsx`: 443~445(표)·482(모바일)
- `UsMarketBoard.tsx`: 436~438(표)·475(모바일)
- `JpMarketBoard.tsx`: 436~438(표)·475(모바일)
- `CnMarketBoard.tsx`: 437~439(표)·476(모바일)
- `VnMarketBoard.tsx`: 329~331(표)·365(모바일)
- `GbMarketBoard.tsx`: 325~327(표)·361(모바일)
> 라인은 참고용(그동안 편집으로 이동 가능) — **패턴 `(i + 1) % 10 === 0 ... AdSlotRow slot="broker"` 두 개를 각 보드에서 찾아 삭제**하고, 리스트 하단에 하나만 추가.

---

## 검증 → 커밋
```bash
npx tsc --noEmit          # EXIT 0
```
- 6개 국가 탭: 종목 리스트 **중간에 광고 문의 CTA 반복 안 됨**, 리스트 **맨 아래 옅은 "광고 문의하기" 하나만**. 데스크탑·모바일 둘 다.
- 렌즈 미리보기·페이지네이션 회귀 없음. console.log 금지.
```bash
git add components/toolbox/MarketBoard.tsx components/toolbox/UsMarketBoard.tsx components/toolbox/JpMarketBoard.tsx components/toolbox/CnMarketBoard.tsx components/toolbox/VnMarketBoard.tsx components/toolbox/GbMarketBoard.tsx
git commit -m "feat(ui): STEP 664 종목 보드 광고 슬롯 반복 CTA 제거→하단 1개만(광고주 0 정직화·진짜 게재는 광고 대화)"
git push
```

## 세션 마감(Claude Code가 4개 문서 날짜만 오늘로)
STEP 662~664 묶어 CHANGELOG 한 줄("증권사 독립 탭 + 종목 보드 우측 레일=AI 렌즈 미리보기[렌즈+브리핑·PC/모바일]+광고 CTA 정리") + 4개 문서 헤더 날짜 오늘. 상세 인수인계는 Cowork.

## Cowork에게 보고
- 6개 탭 반복 CTA 사라지고 하단 1개만 남았는지 + 회귀 없음.
→ 다음 = **광고 대화**(진짜 광고 데이터 모델·게재·결제 설계 — 사용자와 전략 논의). youtube·피드·리딩방 AdSlotRow도 그때 함께 정리.
