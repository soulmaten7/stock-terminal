<!-- 2026-07-02 -->
# STEP 527 — 모멘텀 신뢰도 최종화 (문구·문서 반영 + 커밋)

> STEP 526 결과: 롱숏 gross +18.7%·t=2.51·샤프0.71 / 비용30bps 후 +17.4% / CAPM 알파 +22%·t2.86 · FF3 +21.8%·t2.78 · FF4(+Mom) +17.4%·t2.35.
> **정직한 읽기**: 방향(추세 지속)은 **통계적으로 견고**(비용·FF3 후에도 유의). 단 수익 '수준'은 과대 — **FF4 알파가 0으로 안 준 것 = 생존편향·동일가중 편향 신호**(순수 모멘텀이면 FF4 알파≈0이 정상). → 방향만 신뢰, 수준은 실전치 아님.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_527_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
모멘텀 렌즈를 "신뢰도 완성"으로 닫기 — 문구·문서에 유의성·비용·알파 + **수준 과대 경고** 정직 반영 + 신뢰도 인프라 커밋.
- **Cowork이 이미 수정**: `lib/lenses.ts`(모멘텀 note: t≈2.5·샤프·비용/FF3 후 유의·수준 과대 경고), `docs/LENS_STRENGTH_MAP.md`(모멘텀 행 [검증·유의]+편향 경고), `docs/LENS_DEV_PLAYBOOK.md`(#18 — 유의≠수준·FF4 미소멸=편향 신호).
- **커밋 대상 신규 인프라**: `lib/backtest_stats.ts`, `scripts/backtest_momentum.ts`(v2), `scripts/backtest_momentum_alpha.ts`.

## 0) French CSV는 커밋 제외 (다운로드 데이터)
```bash
cd ~/stock-terminal && grep -q "data/ff" .gitignore || echo "data/ff/" >> .gitignore && tail -3 .gitignore
```

## 1) 확인
```bash
cd ~/stock-terminal && grep -c "통계적으로 유의" lib/lenses.ts && grep -c "검증·유의" docs/LENS_STRENGTH_MAP.md && grep -c "| 18 |" docs/LENS_DEV_PLAYBOOK.md
```
- [ ] 각각 1 이상.

## 2) 빌드 + 클린 재시작 + 검증
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
sleep 12 && curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); m=[x for x in d['lenses'] if x['key']=='momentum'][0]; print((m.get('note') or '')[:90])"
```
- [ ] "Compiled successfully" + note에 "통계적으로 유의" + "수준은 생존편향".

## 3) 커밋 (신뢰도 인프라 + 모멘텀 최종화)
```bash
git add .gitignore lib/backtest_stats.ts scripts/backtest_momentum.ts scripts/backtest_momentum_alpha.ts lib/lenses.ts docs/LENS_STRENGTH_MAP.md docs/LENS_DEV_PLAYBOOK.md docs/STEP_525_COMMAND.md docs/STEP_526_COMMAND.md docs/STEP_527_COMMAND.md && git commit -m "feat(lens): 모멘텀 신뢰도 완성 — 롱숏 t≈2.5·샤프0.71·비용/FF3 후 유의(방향 견고·수준은 편향 과대), 통계엔진+French알파 (STEP 525~527)" && git push
```

## ✅ 여기까지 = 모멘텀 "신뢰도 등급" 완성 (1렌즈)
- 방향성: 통계 유의·비용/FF3 강건 = **방어 가능한 근거**. 수준: 편향 과대(정직 명시). 무료 데이터 논문급 *방법론* 도달, 생존편향은 벽.
- 신뢰도 엔진(`backtest_stats`·`_alpha`·French)은 이제 **다음 렌즈들이 재사용**.

## ▶ 다음 (STEP 528 — Cowork이 설계)
- 같은 신뢰도 틀(월별 롱숏·t·샤프·FF 알파·비용)을 **저변동 → 밸류 → F-Score → 기술** 순으로 한 렌즈씩.
- 저변동이 다음 1순위(가격 기반이라 데이터 즉시·모멘텀 코드 거의 재사용).
