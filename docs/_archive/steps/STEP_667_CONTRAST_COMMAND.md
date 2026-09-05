<!-- 2026-07-09 -->
# STEP 667 — 🎨 색 대비 마감 (검증 배지 AA + 빨강/파랑 범례)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** HEAD `0874c28`(STEP 666). 라이트 유지·가독성 리파인 마무리.
**목표:** ① 등급 배지 중 **"검증(strong)" 배지의 저대비**(민트 글씨가 흰 배경에 ~1.9:1로 안 읽힘)를 AA(4.5:1)로 수정. ② 빨강=상승/파랑=하락 **범례 소소하게 한 번** 표기(특히 해외 탭 사용자 대비).
**대상:** `components/toolbox/LensPreview.tsx`(+ `app/stock/[symbol]/StockLensClient.tsx`에 같은 패턴 있으면) + 보드 컨트롤 줄.

> ⚠️ **muted(`#6B7280`)는 이미 흰 배경 AA 통과 → 손대지 않음**(전역 토큰 바꾸는 리스크 대비 이득 없음). 색톤 유지.

---

## 1. 검증 배지 대비 수정 — `LensPreview.tsx` `gradeBadgeClass`
현재(17~21행):
```ts
function gradeBadgeClass(tier: string): string {
  if (tier === 'strong') return 'bg-unjong-accent/15 text-unjong-accent';   // ← 민트 글씨 = 저대비
  if (tier === 'partial') return 'bg-amber-50 text-amber-600';
  return 'bg-unjong-background text-unjong-muted';
}
```
→ `strong`의 **글씨색을 다크 틸(`unjong-success` #0E7C7B)로** 교체(팔레트 기존 색·AA 통과):
```ts
function gradeBadgeClass(tier: string): string {
  if (tier === 'strong') return 'bg-unjong-accent/12 text-unjong-success';   // 다크 틸 글씨 = AA
  if (tier === 'partial') return 'bg-amber-50 text-amber-600';
  return 'bg-unjong-background text-unjong-muted';
}
```
> 🎯 목표 = "검증" 글자가 배지 배경 위에서 **AA 4.5:1** 통과·또렷. `text-unjong-success`(#0E7C7B) on 밝은 틸 틴트 ≈ 통과. **CC가 실제 대비를 확인**해 아슬하면 배경을 `/10`으로 더 옅게 하거나 글씨를 조금 더 진하게. `partial`(amber)·default는 유지(대비 OK).

## 2. 같은 배지 패턴 다른 곳도 통일
- `app/stock/[symbol]/StockLensClient.tsx`(전체 렌즈 페이지)에 **동일한 `text-unjong-accent` 등급 배지**가 있으면 같은 방식으로 다크 틸로 교체(미리보기와 종목 페이지 일관).
- grep: `grep -n "text-unjong-accent" app/stock/[symbol]/StockLensClient.tsx` 로 등급 배지 부분 찾아 적용(브랜딩·CTA용 민트는 그대로 두고 **"등급 배지 글씨"만**).

## 3. 빨강/파랑 범례 (소소·데스크탑)
6개 보드 컨트롤 줄(클릭 힌트 옆) 또는 표 헤더 근처에 **작게 한 번**:
```tsx
<span className="ml-2 hidden shrink-0 items-center gap-1.5 text-[10px] text-unjong-muted lg:flex">
  <span className="inline-block h-2 w-2 rounded-full bg-unjong-up" />상승
  <span className="ml-1 inline-block h-2 w-2 rounded-full bg-unjong-down" />하락
</span>
```
- 위치: 클릭 힌트(STEP 665B) 옆이 자연스러움. 공간 부족하면 힌트 아래 한 줄로.
- **선택 사항** — 한국 사용자엔 익숙하니, 넣어보고 어수선하면 뺄 것. 넣는다면 6개 보드 공통(또는 우선 KR만 넣어 느낌 보고 미러).

---

## 4. 검증 → 커밋
```bash
npx tsc --noEmit          # EXIT 0
```
- 미리보기·종목 페이지의 "검증" 배지 글자가 **또렷하게 읽히는지**(민트 흐림 해소). partial/default 회귀 없음.
- (넣었으면) 범례 위치·어수선함 체감.
- console.log 금지.
```bash
git add components/toolbox/LensPreview.tsx "app/stock/[symbol]/StockLensClient.tsx" components/toolbox/MarketBoard.tsx components/toolbox/UsMarketBoard.tsx components/toolbox/JpMarketBoard.tsx components/toolbox/CnMarketBoard.tsx components/toolbox/VnMarketBoard.tsx components/toolbox/GbMarketBoard.tsx
git commit -m "feat(ui): STEP 667 검증 배지 대비 AA(민트→다크틸)+빨강/파랑 범례 (muted는 이미 AA·유지)"
git push
```
> 범례를 KR만 넣었으면 해당 보드만 add. StockLensClient에 배지 패턴 없으면 그 파일 제외.

## 5. 세션 마감(Claude Code가 4개 문서 날짜 오늘로)
STEP 662~667 묶어 CHANGELOG 한 줄("증권사 탭 분리 + 우측 레일=AI 렌즈 미리보기[렌즈+브리핑·PC/모바일]+광고 CTA 정리+지수티커 6개국+대비 마감") + 4개 문서 헤더 날짜. 상세 인수인계는 Cowork.

## Cowork에게 보고
- 검증 배지 또렷해졌는지 + 범례 넣을지/뺄지.
→ 이걸로 UI 리파인 묶음(662~667) 종료. 다음 = **광고 대화**(진짜 광고 데이터 모델) 또는 서학개미 relevance 파이프라인(플레이북 §5).
