<!-- 2026-07-10 -->
# STEP 682 — 🏷️ "AI 렌즈" → "TR-AI 렌즈" 명칭 통일 (빌드·커밋만 · 코드는 Cowork/Opus 완료)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** 코드 편집 + `docs/CHANGELOG.md` 기록은 **Cowork(Opus)가 이미 직접 완료. `tsc --noEmit` = 0 에러 검증 끝.** 이 STEP은 **빌드 확인 + 눈 검증 + 커밋/푸시**만.
**바뀐 것:** 엔진 브랜드명 TR-AI를 UI에 반영. 사용자 노출 "AI 렌즈" → **"TR-AI 렌즈"**.
- `components/AiLensBadge.tsx` — 중앙 `lensLabel()` = `TR-AI ${렌즈/Lens/レンズ/镜头}`(다국어 배지·종목페이지 렌즈 헤더 일괄).
- `components/toolbox/LensPreview.tsx` — 헤더 "TR-AI 렌즈", 빈화면 안내, "AI·사실만"→"TR-AI·사실만", CTA "전체 렌즈·근거 보기"→**"TR-AI 렌즈·근거 보기"**.
- 6개 보드(`MarketBoard`·`Us`·`Jp`·`Cn`·`Vn`·`Gb`) 힌트 "AI 렌즈·브리핑"→"TR-AI 렌즈·브리핑".
- `app/stock/[symbol]/StockLensClient.tsx` "AI·사실만"→"TR-AI·사실만"(2곳), `page.tsx` 제목 "TR-AI 렌즈".
- 내부 주석·SEO 키워드·"렌즈 점수/근거"(개념어)는 **의도적 유지**.

---

## 1. 빌드 확인
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && (npm run dev &) ; sleep 7 ; echo "http://localhost:3333 확인"
```

## 2. 눈으로 확인
- 미리보기 헤더가 **"(T로고) TR-AI 렌즈"**, 하단 CTA가 **"TR-AI 렌즈·근거 보기 →"**.
- 종목 미선택 시 "종목을 선택하면 **TR-AI 렌즈**가 읽어드려요".
- 보드 상단 힌트 "종목 클릭 시 우측에 **TR-AI 렌즈·브리핑**".
- 종목 상세 페이지 렌즈 배지/뉴스 태그 "**TR-AI**". 브라우저 탭 제목에 "TR-AI 렌즈".
- console.log 없음.

## 3. 커밋 → 푸시
```bash
git add components/AiLensBadge.tsx components/toolbox/LensPreview.tsx components/toolbox/MarketBoard.tsx components/toolbox/UsMarketBoard.tsx components/toolbox/JpMarketBoard.tsx components/toolbox/CnMarketBoard.tsx components/toolbox/VnMarketBoard.tsx components/toolbox/GbMarketBoard.tsx "app/stock/[symbol]/StockLensClient.tsx" "app/stock/[symbol]/page.tsx" docs/CHANGELOG.md docs/STEP_682_TRAI_LENS_RENAME_COMMAND.md
git commit -m "feat(brand): AI 렌즈→TR-AI 렌즈 명칭 통일 — 중앙 lensLabel(다국어)+미리보기·보드힌트·종목페이지 반영(엔진 브랜드)"
git push
```
> 4개 문서 헤더 이미 2026-07-10. CHANGELOG STEP 682 기록 완료.

## Cowork에게 보고
- 빌드 통과 + 미리보기/보드/종목페이지 "TR-AI 렌즈" 반영 확인.
