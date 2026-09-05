<!-- 2026-07-03 -->
# STEP 548 — ③ 퀄리티(Quality) 검증 백테스트 (GP/A · ROE)

> 새 기법 = 퀄리티. **product에 넣기 전 먼저 검증**(t·알파). 데이터는 기존 EDGAR로 충분(GP/A·ROE). 통과하면 STEP 549서 렌즈+카피 추가, 못 통과하면 정직하게 제외/참고.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_548_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
Cowork이 `scripts/backtest_quality_rigor.ts` 작성 — **GP/A**(매출총이익/총자산, Novy-Marx)·**ROE**(순이익/자기자본) 고−저 월별 롱숏, 신뢰도 틀(t·샤프·비용·FF알파) 그대로. 은행은 GP/A 자동 제외.
- 이 STEP = 실행 + 보고. (렌즈·카피·커밋은 STEP 549, 검증 결과 본 뒤.)

## 0) French 있는지(없으면 재다운로드)
```bash
cd ~/stock-terminal && (ls data/ff/*.[Cc][Ss][Vv] >/dev/null 2>&1 && echo "data/ff OK") || (mkdir -p data/ff && curl -sL -A "Mozilla/5.0" "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_Factors_CSV.zip" -o /tmp/ff3.zip && unzip -o /tmp/ff3.zip -d data/ff && echo "재다운로드")
```

## 1) 실행 (몇 분 — EDGAR 400 + yahoo 400)
```bash
cd ~/stock-terminal && npx tsx scripts/backtest_quality_rigor.ts
```

## 2) 결과 전체 붙여넣어 보고 (GP/A·ROE 각각)
1. **종목 수·월수** — 표본 충분?(월 100+)
2. **연율·t값·샤프·양의 달** — 고퀄리티−저퀄리티. **|t|>2면 유의**(GP/A는 학계서 강한 편 — Novy-Marx).
3. **회전율·순수익** — 연1회라 낮음.
4. **CAPM·FF3 알파·t** — 시장·규모·가치 통제 후에도 남는가.

## ✅ 판정 기준 (STEP 549)
- GP/A(또는 ROE) 유의(+t) + 알파 유의 → **퀄리티 검증** → 렌즈 추가(`qualityLens`)+카피(ko/en)+로스터 갱신.
- 약함/무의미 → 정직하게 "참고" or 제외(로스터에 결과 기록).
- ⚠️ 수준은 생존편향·동일가중 과대 → 방향·유의만 신뢰(동일 원칙).

## ▶ 다음 (STEP 549 — 결과 후 Cowork 설계)
- 검증되면: `qualityLens` 추가(GP/A·ROE 표시)·`lib/lensCopy` 퀄리티 ko/en·`LENS_ROADMAP`/`LENS_STRENGTH_MAP`/플레이북 갱신·커밋. → 6번째 기법.
