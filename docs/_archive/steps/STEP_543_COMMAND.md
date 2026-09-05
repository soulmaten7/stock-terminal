<!-- 2026-07-03 -->
# STEP 543 — ② UI 틀: 신뢰도 등급 배지 겉면 노출 + 문구("{기법} 알아보기")

> 포지셔닝 키스톤: 카드 겉면에 **각 기법이 얼마나 믿을 만한지(신뢰도 등급)**를 한눈에 → "5개가 다 동등해 보인다" 해소. + "이 기법이란?" → "{기법} 알아보기".

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_543_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
- **Cowork이 이미 수정**:
  - `lib/lenses.ts` — 각 렌즈에 `grade`(배지 텍스트)·`gradeTier`(색) 추가: 모멘텀 **검증**(strong) · 저변동 **검증(방어)**(strong) · 밸류 **표본 약함**(partial) · 기술 **참고용**(ref).
  - `app/stock/[symbol]/page.tsx` — 카드 영문명 옆 **신뢰도 배지**(민트=검증·앰버=조건부/해석·회색=참고) + F-Score **건전성 해석** 배지. "이 기법이란?" → **"{기법} 알아보기"**(예: 모멘텀 알아보기·F-스코어 알아보기).
- ⚠️ lib/lenses는 API 라우트가 쓰니 클린 재시작.

## 0) 확인
```bash
cd ~/stock-terminal && grep -c "gradeTier" lib/lenses.ts && grep -c "gradeBadgeClass" "app/stock/[symbol]/page.tsx" && grep -c "알아보기" "app/stock/[symbol]/page.tsx"
```
- [ ] gradeTier 5(타입+4렌즈), gradeBadgeClass 2(정의+사용), 알아보기 2(렌즈+F-Score).

## 1) 빌드 + 클린 재시작
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
```
- [ ] "Compiled successfully". (LensRead.grade·gradeTier 필수 → 4렌즈 모두 제공)

## 2) 검증
```bash
sleep 12 && curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); print([(x['name'],x['grade'],x['gradeTier']) for x in d['lenses']])"
```
- [ ] `[('모멘텀','검증','strong'), ('저변동성','검증(방어)','strong'), ('기술','참고용','ref'), ('밸류(가치)','표본 약함','partial')]`.
- [ ] 브라우저 `/stock/BRK-A`: 각 카드 영문명 옆 **작은 등급 배지**(모멘텀·저변동=민트 "검증" / 밸류=앰버 "표본 약함" / 기술=회색 "참고용" / F-Score=앰버 "건전성 해석"). 접이식 라벨 "모멘텀 알아보기" 등.

## 3) 커밋
```bash
git add lib/lenses.ts "app/stock/[symbol]/page.tsx" docs/STEP_543_COMMAND.md && git commit -m "feat(lens): 신뢰도 등급 배지 겉면 노출(검증/표본약함/건전성/참고용) + '이 기법이란?'→'{기법} 알아보기' (STEP 543)" && git push
```

## ✅ 여기까지 = 포지셔닝 키스톤(읽기 + 신뢰도) 화면 구현
- 이제 겉면에서 "이 기법으로 이렇게 읽힌다 + 이만큼 믿을 만하다"가 한눈에. 사용자의 "정보에 근거한 선택" 성립.
## ▶ 다음 (②의 남은 것)
- **엇갈림 표시** — 기법들이 서로 다른 방향일 때 "불일치 = 정보" 노출(예: 모멘텀 강세 vs 밸류 낮음).
- 모멘텀 라벨 임계값(①) 후속 · 배포+모바일 눈검수.
