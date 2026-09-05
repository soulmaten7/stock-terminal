<!-- 2026-07-04 -->
# STEP 576 — "TRAI 종합 분석" 스텁 제거 + 청사진 ④ 재정의(뉴스=투명 사실)

> **결정**: 종목 페이지 "TRAI 종합 분석"(5개 렌즈 요약) 스텁 폐기 — 정직한 카드로 사용자가 판단하게 해놨는데 AI가 결론을 대신 내리면 **선택권을 뺏는 것**. 리서치로 "뉴스+기법 결합"은 표준임을 확인했고(Danelfin·TipRanks 등), 우리 위반은 마지막 'Buy/Sell 권유' 뿐 → **④ TRAI 재정의: 뉴스=투명한 사실 렌즈(FinBERT + 헤드라인 + 8-K 이벤트), 결론은 사용자 몫.** 실제 빌드는 카드·조합 다 끝낸 마지막 층.
> **전제 HEAD**: `91d495f`(STEP 575). Cowork이 소스·문서 수정 완료 → Claude Code는 **죽은 라우트 정리 + 빌드 + 클린 재시작 + 커밋**.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_576_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 Cowork이 이미 수정
- `app/stock/[symbol]/page.tsx` — TRAI 종합 스텁 **완전 제거**(바·askAI·aiContent/aiLoading state·TraiMark). 하단 푸터 → "판단은 당신 몫".
- `docs/BUSINESS_STRATEGY.md` — 결정 로그에 "④ TRAI 재정의(뉴스=투명 사실)".
- `docs/LENS_DISPLAY_CHARTER.md` — §0 원칙 5 "외부 정보도 사실로만".

## 0) 죽은 라우트 정리 + 잔재 확인
```bash
cd ~/stock-terminal
rm -rf "app/api/ai-view"   # TRAI 스텁 백엔드(untracked·이제 미사용) 삭제
echo -n "page.tsx TRAI 잔재(0 기대): "; grep -cE "aiContent|askAI|TraiMark|TRAI" "app/stock/[symbol]/page.tsx"
```
- [ ] page.tsx TRAI 심볼 0.

## 1) 타입 검사 + 빌드
```bash
npx tsc --noEmit; echo "tsc EXIT=$?"
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed" | head -8
```
- [ ] `tsc EXIT=0` · "Compiled successfully". (미사용 변수/심볼 에러 없어야.)

## 2) 클린 재시작
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
sleep 12
curl -s -o /dev/null -w "lens page %{http_code}\n" "http://localhost:3333/stock/NVDA"
```
- [ ] 200. (렌즈 페이지 정상 렌더 — TRAI 바 없이.)

## 3) 커밋 + push
```bash
git add "app/stock/[symbol]/page.tsx" docs/BUSINESS_STRATEGY.md docs/LENS_DISPLAY_CHARTER.md docs/STEP_576_COMMAND.md && git commit -m "refactor(lens): 'TRAI 종합 분석' 스텁 제거(사용자 판단권 보존) + 청사진 ④ 재정의(뉴스=투명 사실 렌즈·결론은 사용자) + 헌장 원칙5 (STEP 576)" && git push
```

## ✅ 여기까지 = 종목 페이지 = 정직한 렌즈 카드 그 자체. AI 결론 없음.
## ▶ 다음 = Cowork 눈검수(TRAI 바 사라졌는지) → 나머지 6개 카드 헌장 적용(모멘텀부터). 뉴스 투명 렌즈는 맨 마지막.
