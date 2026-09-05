<!-- 2026-07-02 -->
# STEP 536 — 기술(RSI·MA) 신뢰도 (월별 롱숏·t·알파) · 마지막 렌즈

> 신뢰도 틀 5번째(마지막). 기술은 이미 참고용 → RSI 평균회귀·200일선 추세를 월별 롱숏 t·알파로 공식 확인.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_536_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
Cowork이 `scripts/backtest_technical_rigor.ts` 작성(① RSI 3분위 저−고 ② 200일선 위−아래, 월별 롱숏·t·샤프·FF알파, French 재사용).
- 이 STEP = 실행 + 보고. (커밋·문구는 STEP 537 = 마지막 최종화 + 세션 문서.)

## 0) French 있는지(없으면 재다운로드)
```bash
cd ~/stock-terminal && (ls data/ff/*.[Cc][Ss][Vv] >/dev/null 2>&1 && echo "data/ff OK") || (mkdir -p data/ff && curl -sL -A "Mozilla/5.0" "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_Factors_CSV.zip" -o /tmp/ff3.zip && unzip -o /tmp/ff3.zip -d data/ff && echo "재다운로드")
```

## 1) 실행 (몇 분 — 일봉 500종목)
```bash
cd ~/stock-terminal && npx tsx scripts/backtest_technical_rigor.ts
```

## 2) 결과 전체 붙여넣어 보고
1. **① RSI 평균회귀(저RSI−고RSI)** 연율·t·샤프·**월 회전율**·FF알파 — 음/무의미면 "침체매수 미작동"(과열=모멘텀 우위) 확인. 회전율 높으면 비용에도 약함.
2. **② 200일선(위−아래)** 연율·t·FF알파 — 약한 +여도 FF3(또는 Mom)에 흡수되면 "모멘텀의 약한 사촌" 확인.

## ✅ 판정 (STEP 537 반영)
- RSI 무의미/음 + MA 약함·흡수 → 기술 "상태 표시(참고용)·독립 신호 아님" **정식 확정**(현재 입장 유지).
- (예상 밖 강한 유의 시 재검토.)
- ⚠️ 생존편향 잔존 문구 유지.

## ▶ 다음 (STEP 537 — 마지막)
- 기술 note·`LENS_STRENGTH_MAP`·플레이북(#22) 갱신 + 커밋. → **5렌즈 전부 t·알파 신뢰도 재검 완료 = 신뢰도 업그레이드 사이클 종료.**
- 이어서 세션 문서(SESSION_BOOT·CHANGELOG 등) 갱신 = 세션 마무리.
