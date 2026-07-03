<!-- 2026-07-03 -->
# STEP 549 — ③ 퀄리티(Quality·GP/A) 렌즈 추가 (6번째 · 검증)

> STEP 548 검증: GP/A(Novy-Marx) 롱숏 **t=2.92·FF3 알파 t=2.49**(시장·규모·가치 넘는 독립 프리미엄)·회전율 29%(저비용). ROE는 t=1.00 유의미달(대형주 편중)이라 **제외**. → GP/A만 렌즈로 추가.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_549_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
- **Cowork이 이미 작성/수정**:
  - `lib/lenses.ts` — `qualityLens(grossProfit, totalAssets, locale)` 추가(GP/A%·검증 등급·note).
  - `lib/lensCopy.ts` — 퀄리티 ko/en(name·what·about).
  - `app/api/lens/route.ts` — fts 최신연도 매출총이익·총자산 → `qualityLens` push(은행=매출총이익 없어 GP/A "—").
  - 문서: `LENS_STRENGTH_MAP`(퀄리티 행)·`LENS_ROADMAP`(현재 6·후보서 이동)·`LENS_DEV_PLAYBOOK`(#23)·`LENS_COPY`(퀄리티).
  - `scripts/backtest_quality_rigor.ts`(STEP 548 신규) 커밋 포함.
- ⚠️ API 라우트 변경 → 클린 재시작.

## 0) 확인
```bash
cd ~/stock-terminal && grep -c "qualityLens" lib/lenses.ts app/api/lens/route.ts && grep -c "quality:" lib/lensCopy.ts
```
- [ ] qualityLens lenses·route 각 1+, lensCopy quality 2(ko/en).

## 1) 빌드 + 클린 재시작
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
```
- [ ] "Compiled successfully".

## 2) 검증 (퀄리티 렌즈 노출 · ko/en)
```bash
sleep 12
echo "== ko ==" && curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); q=[x for x in d['lenses'] if x['key']=='quality']; print(q[0]['name'],q[0]['grade'],q[0]['long'],q[0]['detail']) if q else print('NO QUALITY')"
echo "== en ==" && curl -s "http://localhost:3333/api/lens?symbol=NVDA&lang=en" | python3 -c "import sys,json; d=json.load(sys.stdin); q=[x for x in d['lenses'] if x['key']=='quality']; print(q[0]['name'],'|',q[0]['summary'][:40]) if q else print('NO')"
```
- [ ] ko: `퀄리티 검증 <높음/보통/낮음> {'GP/A%': ...}`.
- [ ] en: `Quality | How efficiently a company turns…`.
- [ ] 브라우저 `/stock/NVDA`: **퀄리티(GP/A) 카드**(민트 "검증" 배지). `/stock/BRK-A`(은행): 퀄리티 GP/A "—"(미적용).

## 3) 커밋
```bash
git add lib/lenses.ts lib/lensCopy.ts app/api/lens/route.ts scripts/backtest_quality_rigor.ts docs/LENS_STRENGTH_MAP.md docs/LENS_ROADMAP.md docs/LENS_DEV_PLAYBOOK.md docs/LENS_COPY.md docs/STEP_548_COMMAND.md docs/STEP_549_COMMAND.md && git commit -m "feat(lens): 퀄리티(Quality·GP/A) 렌즈 추가 — 6번째·검증(t2.9·FF3α유의)·ROE 제외 + 백테스트·문서 (STEP 548~549)" && git push
```

## ✅ 여기까지 = 6번째 기법(퀄리티) 추가 — 인프라 재사용으로 STEP 2개 만에
- 현재 기법: 모멘텀·저변동·**퀄리티**(검증·유의) / 밸류(표본약함)·F-Score(건전성) / 기술(참고용).
## ▶ 다음 후보
- 새 기법(마법공식=가치+퀄리티, 주주환원) · 일본어·중국어 카피 · 배포+모바일 눈검수.
