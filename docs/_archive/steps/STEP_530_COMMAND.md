<!-- 2026-07-02 -->
# STEP 530 — 밸류 신뢰도 (E/P·B/M 월별 롱숏·t·샤프·비용·FF 알파)

> 신뢰도 틀 3번째 렌즈. 재무팩터라 **연1회(6월) EDGAR 형성 → 월별 수익** 롱숏(싼−비쌈). 지표 E/P·B/M 둘 다.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_530_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
밸류 렌즈를 유의성·비용·알파로 재검증. Cowork이 `scripts/backtest_value_rigor.ts` 작성(EDGAR+가격, French 재사용, 은행 포함).
- 이 STEP = 실행 + 보고. (커밋·문구는 STEP 531.)

## 0) French 있는지(없으면 재다운로드)
```bash
cd ~/stock-terminal && (ls data/ff/*.[Cc][Ss][Vv] >/dev/null 2>&1 && echo "data/ff OK") || (mkdir -p data/ff && curl -sL -A "Mozilla/5.0" "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/F-F_Research_Data_Factors_CSV.zip" -o /tmp/ff3.zip && unzip -o /tmp/ff3.zip -d data/ff && echo "재다운로드")
```

## 1) 실행 (몇 분 — EDGAR 400 + yahoo 400)
```bash
cd ~/stock-terminal && npx tsx scripts/backtest_value_rigor.ts
```

## 2) 결과 전체 붙여넣어 보고 (E/P·B/M 각각)
1. **연율·t값·샤프·양의 달** — 밸류 롱숏(싼−비쌈)이 유의(|t|>2)한지. E/P가 B/M보다 강했던 과거(STEP 520)와 일치?
2. **회전율·순수익** — 연1회 리밸런스라 회전율 낮음 → 비용 거의 무해(모멘텀과 대조).
3. **CAPM 알파·t** = 시장 넘는 가치 프리미엄.
4. **FF3 알파·t + βHML** — 핵심 해석: FF3는 HML(가치팩터) 포함 → **βHML 크고 FF3 알파가 0으로 줄면 "우리 밸류 = 학계 가치팩터 그 자체"라는 정상 신호**(기각 아님). CAPM 알파로 프리미엄 크기를, FF3로 정체성을 본다.

## ✅ 판정 (STEP 531 반영)
- E/P·B/M 유의(+t) + CAPM 알파 유의 → 밸류 "방향성 견고" 신뢰도 격상.
- FF3 알파≈0·βHML↑ → 정상(가치팩터 재현). 기각 아님.
- 한쪽만 유의 → 조건부(E/P·B/M 중 어느 게 견고한지 명시).
- ⚠️ 수준은 생존편향·동일가중 과대 → 방향·유의만 신뢰(동일 원칙). 성장주 강세기 역전(2018~19)도 유지 언급.

## ▶ 다음 (STEP 531 — Cowork이 설계)
- 밸류 note·`LENS_STRENGTH_MAP`·플레이북(#20) 갱신 + 스크립트 커밋. → 3번째 렌즈 완성.
- 이후 F-Score(EDGAR 재무·롱숏은 점수 상−하) → 기술(RSI·MA는 이미 참고용, 신뢰도 틀로 재확인) 순.
