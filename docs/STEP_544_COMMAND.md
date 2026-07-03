<!-- 2026-07-03 -->
# STEP 544 — ② 기법 엇갈림 표시 (모멘텀 × 밸류 성향 요약)

> "엇갈림 = 정보." 방향 축의 핵심 긴장(모멘텀×밸류)을 맨 위에 성향으로 요약. 5개를 억지로 매수/매도 한 표로 뭉치지 않음(축이 다름). 예측·매수신호 아님.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_544_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
- **Cowork이 이미 수정**: `app/stock/[symbol]/page.tsx` — `styleRead()`(모멘텀 long × 밸류 long → 성향 문장) + 헤더에 "기법 성향" 요약 박스(중립 색·매수신호 아님) + "일치=신뢰·엇갈림=정보" 안내.
- (page.tsx만 — 컴포넌트라 HMR. API 변경 없음.)

## 0) 확인
```bash
cd ~/stock-terminal && grep -c "styleRead" "app/stock/[symbol]/page.tsx" && grep -c "기법 성향" "app/stock/[symbol]/page.tsx"
```
- [ ] styleRead 3(정의+계산+…), "기법 성향" 1 이상.

## 1) 빌드
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
- [ ] "Compiled successfully".

## 2) 눈검수 (dev 이미 떠 있으면 그대로, 아니면 재기동)
```bash
(curl -s "http://localhost:3333/api/lens?symbol=NVDA" >/dev/null 2>&1) || (pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 & sleep 12)
```
- [ ] 브라우저 **`/stock/NVDA`**: 상단 "기법 성향 · 모멘텀↑ · 밸류 비쌈 → 모멘텀·성장 성격 …" (엇갈림 케이스).
- [ ] **`/stock/BRK-A`**: "기법 성향 · 뚜렷한 성향 없음 — 중립 구간" (중립 케이스). 둘 다 매수/매도 색 아님.

## 3) 커밋
```bash
git add "app/stock/[symbol]/page.tsx" docs/STEP_544_COMMAND.md && git commit -m "feat(lens): 기법 엇갈림 표시 — 모멘텀×밸류 성향 요약(성장/가치/정렬/중립)·불일치=정보 (STEP 544)" && git push
```

## ✅ 여기까지 = ② UI 틀 핵심 완료 (등급 배지 + 엇갈림 표시)
- 겉면에서 "이 기법으론 이렇게 + 이만큼 믿을 만 + 기법끼리 이렇게 엇갈림(=성격)"이 한눈에.
## ▶ 다음 후보
- 배포 + 모바일 눈검수 · 세션 문서 갱신(오늘 STEP 539~544) · (그 뒤) ③ 새 기법(퀄리티) 착수.
