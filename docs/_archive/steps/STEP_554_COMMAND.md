<!-- 2026-07-03 -->
# STEP 554 — 자산성장(Asset Growth·CMA) 렌즈 추가 (7번째 · 표본 약함)

> STEP 553 검증: 저−고 롱숏 연~+8%·**βHML0.17(밸류와 독립 축)** 이나 t1.6 유의미달. → 주주환원(밸류 재포장=탈락)과 달리 **독립된 새 축이라 효용 有** → **채용하되 등급은 정직히 "표본 약함"**(밸류와 동 tier). 원칙: **채용=효용(독립성+해석) / 등급=유의성.**

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_554_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
- **Cowork이 이미 작성/수정**:
  - `lib/lenses.ts` — `assetGrowthLens(assetGrowthPct, locale)` 추가(표본 약함·라벨 공격적/보통/보수적·note).
  - `lib/lensCopy.ts` — `assetgrowth` ko/en(name·what·about) + 타입에 `assetgrowth: LensText` 추가.
  - `app/api/lens/route.ts` — 최신연도 총자산 전년比 계산(rows[n-1]/rows[n-2]) → `assetGrowthLens` push.
  - 문서: `LENS_ROADMAP`(현재 7·자산성장 채용)·`LENS_STRENGTH_MAP`(행)·`LENS_DEV_PLAYBOOK`(#25)·`SESSION_BOOT`·`NEXT_SESSION_START`.
  - `scripts/backtest_assetgrowth_rigor.ts`(STEP 553 신규) 커밋 포함.
- ⚠️ API 라우트 변경 → 클린 재시작.

## 0) 확인
```bash
cd ~/stock-terminal && grep -c "assetGrowthLens" lib/lenses.ts app/api/lens/route.ts && grep -c "assetgrowth" lib/lensCopy.ts
```
- [ ] assetGrowthLens lenses·route 각 1+, lensCopy assetgrowth 3(타입+ko+en).

## 1) 빌드 + 클린 재시작
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
```
- [ ] "Compiled successfully" · 타입 에러 0.

## 2) 검증 (자산성장 렌즈 노출 · ko/en)
```bash
sleep 12
echo "== ko ==" && curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); q=[x for x in d['lenses'] if x['key']=='assetgrowth']; print(q[0]['name'],q[0]['grade'],q[0]['long'],q[0]['detail']) if q else print('NO ASSETGROWTH')"
echo "== en ==" && curl -s "http://localhost:3333/api/lens?symbol=NVDA&lang=en" | python3 -c "import sys,json; d=json.load(sys.stdin); q=[x for x in d['lenses'] if x['key']=='assetgrowth']; print(q[0]['name'],'|',q[0]['summary'][:40]) if q else print('NO')"
```
- [ ] ko: `자산성장 표본 약함 <공격적/보통/보수적> {'자산성장%': ...}`.
- [ ] en: `Asset Growth | How fast a company is expanding…`.
- [ ] 브라우저 `/stock/NVDA`: **자산성장 카드**(호박색 "표본 약함" 배지·라벨). 기존 6개 렌즈 정상. 총 **7개 렌즈**.

## 3) 커밋
```bash
git add lib/lenses.ts lib/lensCopy.ts app/api/lens/route.ts scripts/backtest_assetgrowth_rigor.ts docs/LENS_ROADMAP.md docs/LENS_STRENGTH_MAP.md docs/LENS_DEV_PLAYBOOK.md docs/SESSION_BOOT.md docs/NEXT_SESSION_START.md docs/STEP_553_COMMAND.md docs/STEP_554_COMMAND.md && git commit -m "feat(lens): 자산성장(Asset Growth·CMA) 렌즈 추가 — 7번째·표본약함(βHML0.17 독립 축·t1.6) + 백테스트·문서 (STEP 553~554)" && git push
```

## ✅ 여기까지 = 7번째 기법(자산성장) 추가 — 독립 효용 채용·정직 등급
- 현재: 모멘텀·저변동·퀄리티 **검증** / 밸류·**자산성장 표본약함** / F-Score 건전성 / 기술 참고. (주주환원=탈락·마법공식=보류.)
## ▶ 다음
- **발생액(Accruals·Sloan)** 검증 — (순이익−영업현금)/총자산. `netIncome`·`operatingCashFlow` 이미 있음. Cowork이 백테스트 작성 → 실행 → 독립·효용 판정.
