<!-- 2026-07-02 -->
# STEP 529 — 저변동성 신뢰도 최종화 (문구·문서 + 커밋)

> STEP 528: 저 leg 위험=고 leg의 18%(방어)·저 leg +10.8% vs 고 −1.3% / 롱숏 raw +12.1%·**t=1.56(유의 미달)** / **CAPM 알파 +22.5%·t=3.05**·βMkt−0.81 / **FF3 알파 +18.1%·t=2.62** / 회전율 10.7%(모멘텀 1/4)·비용 거의 무해.
> **정직한 읽기**: raw 수익차는 통계적으로 약하나(시장베타 음이라 노이즈), **위험조정 알파는 유의** + 위험 비대칭 극적 → **방어·위험관리 렌즈로 유효**(수익 우위 단정은 X). 수준은 편향 과대.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_529_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
저변동 렌즈를 "신뢰도(위험대비)" 정직 문구로 닫고 커밋.
- **Cowork이 이미 수정**: `lib/lenses.ts`(저변동 note: 위험18%·CAPM/FF3 알파 유의·회전율 낮음·**수익 우위 단정 X**), `docs/LENS_STRENGTH_MAP.md`(저변동 행 [검증·위험대비]), `docs/LENS_DEV_PLAYBOOK.md`(#19 — 렌즈마다 성공지표 다름·raw 약해도 알파 유의).
- **커밋 신규**: `scripts/backtest_lowvol_rigor.ts`.

## 1) 확인
```bash
cd ~/stock-terminal && grep -c "위험대비가 핵심" lib/lenses.ts && grep -c "검증·위험대비" docs/LENS_STRENGTH_MAP.md && grep -c "| 19 |" docs/LENS_DEV_PLAYBOOK.md
```
- [ ] 각각 1 이상.

## 2) 빌드 + 클린 재시작 + 검증
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
sleep 12 && curl -s "http://localhost:3333/api/lens?symbol=SO" | python3 -c "import sys,json; d=json.load(sys.stdin); v=[x for x in d['lenses'] if x['key']=='lowvol'][0]; print((v.get('note') or '')[:90])"
```
- [ ] "Compiled successfully" + note에 "위험조정 알파" + "위험대비가 핵심". (SO=서던컴퍼니, 대표적 저변동주)

## 3) 커밋
```bash
git add scripts/backtest_lowvol_rigor.ts lib/lenses.ts docs/LENS_STRENGTH_MAP.md docs/LENS_DEV_PLAYBOOK.md docs/STEP_528_COMMAND.md docs/STEP_529_COMMAND.md && git commit -m "feat(lens): 저변동 신뢰도 완성 — 위험 18%·CAPM/FF3 알파 유의(방어·위험대비 핵심)·raw 수익차 약함 (STEP 528~529)" && git push
```

## ✅ 여기까지 = 저변동 "신뢰도 등급" 완성 (2번째 렌즈)
- 방어·위험대비 근거 견고(위험 비대칭·위험조정 알파 유의·저비용). 수익 우위는 단정 안 함(정직). 신뢰도 틀 2렌즈 적용 완료.

## ▶ 다음 (STEP 530 — Cowork이 설계)
- **밸류** 신뢰도 — 재무팩터라 EDGAR 기반 월별 롱숏(E/P·B/M) + t·샤프·비용·FF 알파(HML 겹침 주목: 밸류 알파가 HML로 설명되면 "우리 밸류=학계 가치팩터" 정상).
- 이후 F-Score → 기술.
