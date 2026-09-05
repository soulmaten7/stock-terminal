<!-- 2026-07-03 -->
# STEP 551 — 주주환원(Shareholder Yield) 검증 백테스트 (새 기법 ①단계)

> ③ 새 기법 로스터 다음 = **주주환원**(배당+자사주매입/시총, Meb Faber). 퀄리티처럼 **검증 먼저 → 통과 시 렌즈 추가(STEP 552)**.
> Cowork이 백테스트 스크립트 `scripts/backtest_shyield_rigor.ts` 작성 완료(EDGAR 현금흐름표 태그 자체 추출·production 미변경). Claude Code는 **실행 + 결과 붙여넣기**만.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_551_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
- 주주환원 팩터가 **진짜 수익 신호인지** + **가치(HML) 넘는 독립 프리미엄인지** 검증.
- 총주주환원 (배당+자사주)/시총 vs 순주주환원 (−발행) 둘 다. 은행 제외 안 함.
- **판정 기준(퀄리티와 동일)**: 롱숏 t·샤프 + **FF3 알파(HML 조정 후) t** 가 핵심. 알파 살면=독립(검증), 죽으면=가치 재포장(참고/제외).

## 0) French 팩터 존재 확인 (없으면 알파 계산 스킵됨)
```bash
cd ~/stock-terminal && ls -la data/ff/ 2>/dev/null && echo "--- factors csv 있음? ---" && ls data/ff/*[Ff]actors*.csv 2>/dev/null || echo "⚠️ data/ff 없음 → 아래 curl로 받기"
```
- French 없으면(신규 클론 등) 받기:
```bash
cd ~/stock-terminal && mkdir -p data/ff && curl -s -A "Trillion Research admin@onetrillion.app" -o /tmp/ff.zip "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_Factors_CSV.zip" && cd data/ff && unzip -o /tmp/ff.zip && ls
```

## 1) 백테스트 실행 (수 분 — EDGAR+야후 네트워크)
```bash
cd ~/stock-terminal && npx tsx scripts/backtest_shyield_rigor.ts 2>&1 | tail -25
```

## 2) 결과 전체를 Cowork에 붙여넣기
- **[주주환원 신뢰도]** 헤더 + 종목 수·**배당지급 태그 N·자사주 태그 N**(커버리지 확인 = 데이터 되는지) +
- **총주주환원** / **순주주환원** 각각: 연율·변동성·**t**·샤프·양의 달·회전율·순수익 + **CAPM 알파 t**·**FF3 알파 t**·βMkt/βSMB/**βHML**.
- ⚠️ 커버리지(배당/자사주 태그)가 종목의 대부분이면 데이터 OK. 절반 이하로 낮으면 태그 후보 보강 필요(Cowork이 판단).

## ✅ 여기까지 = 주주환원 검증 결과 확보 (렌즈 추가 X — 판정은 Cowork이)
- 통과(FF3 알파 유의): STEP 552에서 `shareholderYieldLens` 추가 + edgar.ts 태그 승격 + ko/en 카피.
- 미통과(알파 소멸): 정직하게 "가치 재포장·참고" 또는 제외 → 로스터에서 다음 후보로.
- 커밋은 STEP 552(판정 후)에서. 이 STEP은 **검증 실행만**.
