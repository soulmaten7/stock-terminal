<!-- 2026-07-10 -->
# STEP 681 — 🧹 미리보기 광고 제거 + UI 태그라인 교체 (빌드·커밋만 · 코드는 Cowork/Opus 완료)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** 아래 코드 편집 + `docs/CHANGELOG.md` 기록은 **Cowork(Opus)가 이미 직접 완료. `tsc --noEmit` = 0 에러 검증 끝.** 이 STEP은 **빌드 확인 + 눈 검증 + 커밋/푸시**만.
**바뀐 것:**
- `components/toolbox/LensPreview.tsx` — **미리보기 밑 '광고 문의하기' 카드 완전 제거**(PC·모바일). `preview_banner_pc`+어필리에이트 블록·미사용 import(`ExternalLink`·`ChevronRight`·`liveAffiliates`·`soldCreative`) 삭제. AI 카드엔 렌즈·브리핑·"전체 렌즈보기"만. (광고는 리스트 10개마다 `AdSlotRow slot="feed"`로 유지 — 손 안 댐.)
- `components/layout/Footer.tsx` · `app/about/page.tsx` · `app/auth/login/page.tsx` — 태그라인 "흩어진 금융정보를 한눈에" → **"전문가 시각으로, TR-AI가 무료로 분석해 드립니다"**.

---

## 1. 빌드 확인
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && (npm run dev &) ; sleep 7 ; echo "http://localhost:3333 확인"
```

## 2. 눈으로 확인
- 종목 선택 → 우측 미리보기(PC)·모바일 시트에 **"광고 문의하기" 카드 없음.** AI 렌즈·브리핑·"전체 렌즈·근거 보기"만.
- 정보 탭 피드/링크 리스트엔 여전히 10개마다 광고 슬롯 있음(정상).
- 푸터·`/about`·`/auth/login` 태그라인이 "전문가 시각으로, TR-AI가 무료로 분석해 드립니다"로 바뀜.
- console.log 없음.

> 런타임 이상 있으면 고치지 말고 증상만 Cowork에 보고.

## 3. 커밋 → 푸시
```bash
git add components/toolbox/LensPreview.tsx components/layout/Footer.tsx app/about/page.tsx app/auth/login/page.tsx docs/CHANGELOG.md docs/STEP_681_PREVIEW_AD_REMOVE_TAGLINE_COMMAND.md
git commit -m "feat(ui): 미리보기 광고 카드 제거(광고는 리스트 10개마다 일원화) + UI 태그라인 3곳 새 정체성 문구로 교체"
git push
```
> 4개 문서 헤더 이미 2026-07-10. CHANGELOG STEP 681 기록 완료.

## Cowork에게 보고
- 빌드 통과 + 미리보기 광고 사라졌는지 + 태그라인 교체 확인.
