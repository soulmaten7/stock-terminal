<!-- 2026-07-03 -->
# STEP 541 — 기법 개념·유래 설명 추가 ('이 기법이란?')

> 피드백: '자세히'는 계산·검증(어떻게 계산했나)이라, 일반 사용자가 **이 기법이 뭐고·왜 생겨서·왜 쓰나**를 모름 → 쉬운 개념 설명을 별도로.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_541_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
- **Cowork이 이미 수정**: `lib/lenses.ts`(각 렌즈 `about` 추가 — 개념·유래·왜 쓰나), `app/stock/[symbol]/page.tsx`(요약 아래 **"▾ 이 기법이란?"**(민트) 접이식 + F-Score도 동일. '자세히·검증'과 별개 토글).
- ⚠️ API 라우트 렌즈 객체에 `about` 추가되니 클린 재시작.

## 0) 확인
```bash
cd ~/stock-terminal && grep -c "about:" lib/lenses.ts && grep -c "이 기법이란" "app/stock/[symbol]/page.tsx"
```
- [ ] `about:` = 4(렌즈), "이 기법이란" = 2(렌즈 카드 + F-Score).

## 1) 빌드 + 클린 재시작
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
```
- [ ] "Compiled successfully". (LensRead.about 필수 → 4렌즈 모두 제공)

## 2) 검증
```bash
sleep 12 && curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); m=d['lenses'][0]; print('about:',(m.get('about') or '')[:60])"
```
- [ ] `about: 오른 주식은 한동안 더 오르는 '관성'…`.
- [ ] 브라우저 `/stock/BRK-A`: 각 카드 요약 아래 **민트 "▾ 이 기법이란?"** → 펼치면 개념·유래(예: 제가디시·티트만 1993, 피오트로스키 2000 등). 그 아래 회색 "▾ 자세히 · 검증 근거·한계" 별도.

## 3) 커밋
```bash
git add lib/lenses.ts "app/stock/[symbol]/page.tsx" docs/STEP_541_COMMAND.md && git commit -m "feat(lens): 기법 개념·유래 설명 '이 기법이란?' 접이식 추가 — 검증(자세히)과 분리 (STEP 541)" && git push
```

## ✅ 여기까지 = 기법 교육 레이어 추가
- 요약(언제) → 이 기법이란?(뭐고·왜) → 근거 수치 → 자세히(검증·한계). 일반 사용자도 기법을 이해.
## ▶ 다음 후보
- TRAI 로고 SVG 다듬기 · 배포+모바일 눈검수 · (유료 TRAI 종합은 계속 보류)
