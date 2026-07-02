<!-- 2026-07-02 -->
# STEP 526 — 모멘텀 신뢰도 완성 (거래비용 + Fama-French 알파)

> STEP 525: 롱숏 연 +18.8%·t=2.50·샤프 0.71(유의). 단 gross·비용0·생존편향 → 부풀려짐.
> 이 STEP: **거래비용 차감 + French 팩터 알파**로 "비용 견디고 기존 팩터 넘는 순수 초과수익이냐" 검정.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_526_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
- **Cowork이 이미 작성**: `lib/backtest_stats.ts`(+`ols` 다중회귀), `scripts/backtest_momentum_alpha.ts`(회전율→순수익 + CAPM·FF3·FF4 알파).
- 이 STEP = French 데이터 내려받기(무료) + 실행 + 보고. (커밋은 STEP 527 최종화에서.)

## 1) Ken French 팩터 데이터 내려받기 (무료·공개 학술데이터)
```bash
cd ~/stock-terminal && mkdir -p data/ff && \
curl -sL -A "Mozilla/5.0" "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_Factors_CSV.zip" -o /tmp/ff3.zip && \
curl -sL -A "Mozilla/5.0" "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Momentum_Factor_CSV.zip" -o /tmp/ffmom.zip && \
unzip -o /tmp/ff3.zip -d data/ff && unzip -o /tmp/ffmom.zip -d data/ff && ls -la data/ff
```

## 2) 형식 정찰 (파서가 맞는지 — §0-2 정찰 먼저)
```bash
cd ~/stock-terminal && for f in data/ff/*.[Cc][Ss][Vv]; do echo "=== $f ==="; grep -nE "^\s*[12][0-9]{5}," "$f" | head -3; done
```
- [ ] `YYYYMM,값,값,...` 월간 행이 보임(예: `192607, 2.96,-2.30,...`). 안 보이면 형식 다름 → 출력 붙여줘(파서 조정).

## 3) 실행 (몇 분 — yahoo 재조회 500종목)
```bash
cd ~/stock-terminal && npx tsx scripts/backtest_momentum_alpha.ts
```

## 4) 결과 전체 붙여넣어 보고 (순서대로)
1. **총수익(gross)** — 525 재확인(연율·t·샤프).
2. **거래비용** — 월 회전율(롱·숏 합) + **순수익 @10bps·@30bps**. gross 18.8%가 얼마나 깎이나?(모멘텀은 회전율 높아 많이 깎임)
3. **팩터 알파** — 핵심:
   - **CAPM 알파·t** = 시장 빼고 남는 초과수익.
   - **FF3 알파·t** = 시장·규모·가치 빼고 남는 것.
   - **FF4(+Mom) 알파·t** = 모멘텀 팩터까지 넣으면 알파가 0 근처로 줄고 βMom↑ 예상 → "우리 모멘텀 = 학계 모멘텀"이라는 정상 신호(나쁜 게 아님).

## ✅ 판정 (STEP 527에서 반영)
- **net 수익 여전히 +**, CAPM·FF3 알파 유의(t>2) → 모멘텀 "비용·팩터 조정 후에도 방향성 유효"로 **최고 신뢰 등급**.
- net이 얇거나 알파 t 약함 → "gross만 강하고 비용·팩터 조정 시 약화" 정직 하향.
- FF4 알파≈0 → **정상**(우리가 재현한 게 학계 모멘텀 팩터 그 자체라는 뜻). 기각 아님.
- ⚠️ 생존편향 잔존 문구 유지.

## ▶ 다음 (STEP 527 — Cowork이 설계)
- 결과로 모멘텀 렌즈 note·`LENS_STRENGTH_MAP`·플레이북(#18) 갱신 + 신뢰도 인프라(`backtest_stats`·`_alpha`·French 어댑터) 커밋. → 모멘텀 "신뢰도 완성" 1렌즈 닫기.
- 이후 같은 틀(t·샤프·알파·비용)을 저변동→밸류→F-Score→기술 순으로 한 렌즈씩.
