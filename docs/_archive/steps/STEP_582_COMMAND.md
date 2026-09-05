<!-- 2026-07-05 -->
# STEP 582 — 이벤트 사실 레이어 UI (종목 페이지 · 이벤트 층 STEP C2)

> **목표**: `/stock/[symbol]`에 **"최근 중대 공시·이벤트" 리스트**(시간축 스트립 아래) + 각 **렌즈 카드에 ⚠️(A·근거 흔듦)/📌(B·새 사실) 플래그**. 사실만·예측 없음·판단은 사용자. **소스는 Cowork이 이미 수정** → Claude Code는 **빌드 + 눈검수 + 커밋 + push**.
> **전제 HEAD**: `4b0aa97`(STEP 581 — 이벤트 백엔드).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_582_COMMAND.md 파일 내용대로 실행해줘
```

## Cowork이 이미 한 것 (확인용)
- `app/stock/[symbol]/page.tsx` — `/api/events` fetch 추가 · `EventLayer`(최근 중대 8-K 리스트·severity 점·SEC 원문 링크·"방금 사실, 렌즈엔 안 섞임" 고지) · `buildLensFlags`(이벤트→렌즈 매핑) · 렌즈 카드 헤더 칩(⚠️ 근거 주의 / 📌 새 사실) + 펼침 시 "최근 사실" 박스.
- Cowork 사전: `tsc --noEmit` EXIT=0 · 신규 eslint 문제 0(잔여 347행 `setState in effect`는 STEP 580서 배포된 기존 것·비차단).

## 0) 빌드 검증
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -20
```
- [ ] 무에러(setState 경고 무시).

## 1) 눈검수 — 실제 화면
```bash
cd ~/stock-terminal && (npm run dev >/tmp/lensdev.log 2>&1 &) ; sleep 14 ; echo "브라우저 확인:"
echo "  US → http://localhost:3000/stock/NVDA   (이벤트 층 + 렌즈 플래그 떠야)"
echo "  KR → http://localhost:3000/stock/005930 (이벤트 섹션 없음·정상)"
# 확인 후: pkill -f "next dev"
```
- [ ] **NVDA**: 시간축 스트립 아래 **"최근 중대 공시·이벤트"** 섹션 — `2026-07-02 임원 사임/선임(5.02)`·`분기 실적(2.02)` 등 + SEC 원문 링크.
- [ ] **NVDA 렌즈 카드**: F-Score·퀄리티(Quality) 헤더에 **📌 새 사실**(5.02) / **⚠️ 근거 주의**(2.02 실적) 칩. 카드 펼치면 "최근 사실" 박스에 날짜·라벨 + "방향 판정 아님".
- [ ] **005930**: 이벤트 섹션 안 뜸(비US), 나머지 정상.
- [ ] 문구 확인: "좋다/나쁘다 판단 안 함 · 사실만".

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add "app/stock/[symbol]/page.tsx" docs/STEP_582_COMMAND.md && git commit -m "feat(events): 종목 페이지 이벤트 사실 레이어 UI — 최근 중대 8-K 리스트 + 렌즈 카드 ⚠️(근거 흔듦)/📌(새 사실) 플래그 (STEP 582)" && git push
```

## ✅ 여기까지 = 이벤트 층(US) 백+프론트 완성. 스크린샷 공유 → 문구·플래그 위치 미세조정. 다음 후보 = 거래량 맥락(WIIM-lite) · 추정치 렌즈(US) · 세션 문서 매듭.
