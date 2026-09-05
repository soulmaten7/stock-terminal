<!-- 2026-07-02 -->
# STEP 528 — 저변동성 신뢰도 (월별 롱숏·t·샤프·거래비용·FF 알파)

> 신뢰도 틀 2번째 렌즈. 모멘텀 엔진 재사용(빠름). ⚠️ 방향 반대 = **저변동 매수·고변동 매도**(BAB). 핵심은 '위험 대비 우위'.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_528_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
저변동 렌즈를 유의성·비용·알파 + **리스크 스토리**로 재검증. Cowork이 `scripts/backtest_lowvol_rigor.ts` 작성(French는 data/ff 재사용).
- 이 STEP = 실행 + 보고. (커밋·문구는 STEP 529.)

## 0) French 데이터 있는지(없으면 재다운로드)
```bash
cd ~/stock-terminal && (ls data/ff/*.[Cc][Ss][Vv] >/dev/null 2>&1 && echo "data/ff OK") || (mkdir -p data/ff && curl -sL -A "Mozilla/5.0" "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_Factors_CSV.zip" -o /tmp/ff3.zip && curl -sL -A "Mozilla/5.0" "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Momentum_Factor_CSV.zip" -o /tmp/ffmom.zip && unzip -o /tmp/ff3.zip -d data/ff && unzip -o /tmp/ffmom.zip -d data/ff && echo "재다운로드 완료")
```

## 1) 실행 (몇 분 — 일봉 500종목·변동성 계산)
```bash
cd ~/stock-terminal && npx tsx scripts/backtest_lowvol_rigor.ts
```

## 2) 결과 전체 붙여넣어 보고 (순서대로)
1. **리스크 스토리(핵심)** — 저변동 leg vs 고변동 leg의 **연율수익 + 평균 실현변동성**. 포인트: 저변동 leg가 **비슷하거나 나은 수익을 훨씬 낮은 위험**으로? (저 leg 위험이 고 leg의 몇 %인지)
2. **롱숏(저−고)** — 연율·**t값**·**샤프**·양의 달. 저변동 L-S는 변동성이 낮아 **샤프가 모멘텀보다 높을 수 있음**(이례현상의 정수).
3. **거래비용** — 저변동은 회전율 낮음(vol 지속적) → 비용 덜 먹힘(모멘텀과 대조).
4. **FF 알파** — CAPM βMkt가 **음(−)이면 방어적**(정상), 그래서 CAPM 알파 높게. FF3에서 얼마나 남나.

## ✅ 판정 (STEP 529 반영)
- L-S 유의(+t) + **저 leg 위험 ≪ 고 leg 위험** + 샤프 양호 → 저변동 "위험대비 우위" 신뢰도 격상.
- ⚠️ 수준은 생존편향·동일가중 과대 → **위험대비·방향·샤프**만 신뢰, 절대수익 수준은 실전치 아님(모멘텀과 동일 원칙).
- L-S 자체가 약해도 **위험이 확연히 낮으면** 저변동의 가치(방어)는 유효 — 정직하게 그렇게.

## ▶ 다음 (STEP 529 — Cowork이 설계)
- 저변동 note·`LENS_STRENGTH_MAP`·플레이북(#19) 갱신 + 스크립트 커밋. → 2번째 렌즈 신뢰도 완성.
- 이후 밸류 → F-Score(둘 다 EDGAR 재무·롱숏은 재무팩터로) → 기술 순.
