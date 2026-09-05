<!-- 2026-07-02 -->
# STEP 539 — 렌즈 페이지 리디자인 (영문명+요약·자세히 접기·너비 통일·TRAI 리브랜딩)

> 사용자 피드백 4: ①홈 너비 통일 ②기법 영문 정식명칭 위+한글 요약 ③긴 검증문구는 '자세히'로 접기 ④AI를 **TRAI**(민트 T 로고)로 리브랜딩.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_539_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
- **Cowork이 이미 수정**: `lib/lenses.ts`(각 렌즈 `nameEn`·`summary` 추가), `app/stock/[symbol]/page.tsx`(전면 리디자인 — `max-w-7xl` 홈 통일·렌즈 2열 그리드·영문명 위/한글명·요약·`<details>` 자세히 접기·`TraiMark` 민트 T 뱃지·버튼 "TRAI 종합 분석").
- 이 STEP = 보드 버튼 rename + 빌드 + 검증 + 커밋.

## 1) 보드 진입버튼 "🧭 AI보기" → "TRAI" 일괄 (4개 보드)
```bash
cd ~/stock-terminal && perl -i -pe 's/🧭 AI보기/TRAI/g' components/toolbox/MarketBoard.tsx components/toolbox/UsMarketBoard.tsx components/toolbox/JpMarketBoard.tsx components/toolbox/CnMarketBoard.tsx && grep -rn "TRAI" components/toolbox/*.tsx | head
```
- [ ] 각 보드에 `TRAI →` / `TRAI — 기법별 전망` 노출(🧭·AI보기 사라짐).

## 2) 빌드
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
- [ ] "Compiled successfully". (타입: LensRead에 nameEn·summary 필수 → 4개 렌즈 모두 제공하므로 통과)

## 3) 클린 재시작 + 검증 (API 라우트 변경 있으니)
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
sleep 12 && curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); m=d['lenses'][0]; print('nameEn:',m.get('nameEn'),'| name:',m.get('name'),'| summary:',(m.get('summary') or '')[:40])"
```
- [ ] `nameEn: Momentum (12-1) | name: 모멘텀 | summary: 최근 1년…`.
- [ ] 브라우저 `/stock/NVDA` 눈으로: **홈과 같은 너비** · 렌즈 2열 · 카드마다 영문명↑/한글명·요약 · "▾ 자세히"로 검증문구 접힘 · 하단 **TRAI 종합 분석**(민트 T 뱃지).

## 4) 커밋
```bash
git add lib/lenses.ts "app/stock/[symbol]/page.tsx" components/toolbox/MarketBoard.tsx components/toolbox/UsMarketBoard.tsx components/toolbox/JpMarketBoard.tsx components/toolbox/CnMarketBoard.tsx docs/STEP_539_COMMAND.md && git commit -m "feat(lens): 렌즈 페이지 리디자인 — 영문 정식명칭+한글 요약·검증문구 자세히 접기·홈 너비 통일·TRAI 리브랜딩(민트 T) (STEP 539)" && git push
```

## ✅ 여기까지 = 렌즈 페이지 표현 개편 1차
- 영문명 앵커(다국어 확장 대비) + 한 줄 요약 + 검증문구 접기 + TRAI 브랜딩 + 홈 너비 일치.
## ▶ 다음 후보
- TRAI 로고 정식 아이콘(SVG) 다듬기 · 실제 배포 후 모바일 눈검수 · (그 뒤) 유료 TRAI 종합 활성화는 계속 보류.
