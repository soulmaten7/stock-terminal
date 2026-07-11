<!-- 2026-07-08 (3rd) -->
# STEP 665 — 👓 표·미리보기 가독성 P0 (라이트 유지·리파인)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** HEAD = STEP 664 커밋 이후. 색톤 = **라이트 유지**(갈아엎지 않음), 이번은 가독성 리파인만.
**목표:** ① 종목 표의 **모든 행에 반복되는 'AI 렌즈' 아이콘 컬럼 제거**(노이즈 최다 요소) + 클릭 힌트 한 줄. ② 미리보기 수익률 라벨 **'전' 붙여 드롭다운과 통일**. ③ 브리핑 본문 가독성.
**대상:** 6개 보드(`MarketBoard`·`Us`·`Jp`·`Cn`·`Vn`·`Gb`) + `LensPreview.tsx`.

> 왜 컬럼 제거: 2,600행에 **동일 민트 T 아이콘 반복 = 정보 0·노이즈만.** AI 렌즈는 이제 우측 미리보기/모바일 시트가 담당하니, 표엔 힌트 한 줄이면 충분.

---

## 1. 6개 보드 — 'AI 렌즈' 컬럼 제거 (⚠️ th 수·colSpan 같이 조정)
각 보드 표는 **6열**(순번·종목명·현재가·**AI렌즈**·기간%·⭐). AI렌즈 열을 빼면 **5열**이 되므로 아래를 세트로:

1. **데스크탑 th 제거** — `<th>...AI 렌즈...</th>`(TLensLogo + "AI 렌즈" 텍스트가 든 th). 그 열 헤더 통째 삭제.
2. **데스크탑 td 제거** — 각 행의 렌즈 아이콘 셀:
```tsx
<td className="px-2 py-2.5 text-center">
  <span className="... rgba(45,212,191,0.14) ..."><TLensLogo size={13} color="#2DD4BF" /></span>
</td>
```
이 `<td>` 삭제.
3. **모바일 헤더 라벨 제거** — 모바일용 헤더 줄(`sm:hidden`)에 있는 `<TLensLogo/> AI 렌즈` 라벨 span 삭제(모바일 카드엔 아이콘 셀이 없으면 라벨만).
4. **colSpan 조정** — 표 안에 `colSpan={6}`이 남아 있으면 **`colSpan={5}`**로(열 5개 됐으니). (STEP 664에서 인피드 광고 tr 제거했으면 없을 수도 있음 — 있으면 조정.)
5. **`TLensLogo` import** — 그 보드에서 더 안 쓰면 제거, 다른 데서 쓰면 유지(grep로 확인).
6. **클릭 힌트 추가** — 표 위(컨트롤 줄 아래)에 데스크탑 전용 한 줄:
```tsx
<p className="mb-1.5 hidden text-[11px] text-unjong-muted lg:block">종목을 클릭하면 우측에 <span className="font-medium text-unjong-accent">AI 렌즈·브리핑</span>이 나와요.</p>
```

> **보드 하나 끝낼 때마다 `npx tsc --noEmit`** + 표가 5열로 정렬 깨지지 않는지 확인. 열 너비(`w-[..]`)가 AI렌즈 열에만 있었으면 삭제, 나머지 열 너비는 유지.
> 헷갈리면 KR `MarketBoard.tsx` 먼저 완성 → 나머지 5개는 동일 패턴.

## 2. `LensPreview.tsx` — 수익률 라벨 '전' 통일 + 브리핑 가독성

**(a) 수익률 라벨** — 현재 `['1일','1주','1개월','3개월','6개월','1년']` → **드롭다운과 동일하게**:
```tsx
[['1일전',stock.changePercent],['1주일전',stock.r1w],['1개월전',stock.r1m],['3개월전',stock.r3m],['6개월전',stock.r6m],['1년전',stock.r1y]]
```
> 라벨이 길어지니 `grid-cols-3`에서 라벨 `text-[11px]` 유지(줄바꿈 되면 `whitespace-nowrap` 추가). 값은 그대로.

**(b) 브리핑 본문 가독성** — 브리핑 문단:
```tsx
<p className="text-[12px] leading-relaxed text-unjong-primary">{brief}</p>
```
→
```tsx
<p className="text-[13px] leading-6 text-unjong-primary">{brief}</p>
```
(12→13px·line-height 확대. 색은 이미 primary면 유지.)

> LensPreview는 데스크탑 레일·모바일 시트 공용이라 한 번 고치면 둘 다 반영. **모바일 시트의 자체 수익률 그리드(보드 파일 안)는 이미 '1일전…'을 쓰므로 건드리지 말 것** — LensPreview의 수익률만 통일.

---

## 3. 검증 → 커밋
```bash
npx tsc --noEmit          # EXIT 0
```
- 6개 탭: 표에 **반복 렌즈 아이콘 사라짐**, 표 위 힌트 한 줄, 열 정렬 정상(5열). 미리보기 수익률 **1일전/1주일전…**, 브리핑 글씨 조금 커지고 줄간격 여유.
- 데스크탑·모바일 회귀 확인. console.log 금지.
```bash
git add components/toolbox/LensPreview.tsx components/toolbox/MarketBoard.tsx components/toolbox/UsMarketBoard.tsx components/toolbox/JpMarketBoard.tsx components/toolbox/CnMarketBoard.tsx components/toolbox/VnMarketBoard.tsx components/toolbox/GbMarketBoard.tsx
git commit -m "feat(ui): STEP 665 가독성 P0 — 표 반복 AI렌즈 아이콘 컬럼 제거+클릭 힌트, 미리보기 수익률 '전' 통일, 브리핑 13px/줄간격"
git push
```

## Cowork에게 보고
- 표 5열 정렬 정상 + 반복 아이콘 제거 체감 + 미리보기 라벨/브리핑 가독성.
→ 다음 = **STEP 666**(지수 티커 6개국 완성 + 등락색/구분선 + 빨강/파랑 범례 + muted 대비 + 등급 배지 대비). 이건 Cowork이 지수 티커 컴포넌트 뜯어보고 설계.
