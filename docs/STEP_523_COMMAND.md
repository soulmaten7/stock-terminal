<!-- 2026-07-02 -->
# STEP 523 — 기술 검증 반영 + 커밋 (🏁 무료 렌즈층 5종 판정 완결)

> STEP 522 결과: RSI 평균회귀 **기각**(침체−과열 −0.9%/3M, 과열이 오히려 우위=모멘텀 압도), 200일선 위−아래 **+0.76%/3M(연~3%·약함)**. → 기술은 "참고용"이 정직.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_523_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
기술 렌즈 정직화 + STEP 522 인프라(lib/technical 리팩터·백테스트)까지 함께 커밋 → **5렌즈 전부 판정 완료 = 무료 렌즈층 완결**.
- **Cowork이 이미 수정**:
  - `lib/lenses.ts` — 기술 note 정직화(RSI 평균회귀 미작동·200일선 약한 우위·상태표시일 뿐 매매신호 아님).
  - `docs/LENS_STRENGTH_MAP.md` — 기술 행 [검증·약함], 주의 문구(5렌즈 전부 판정·미검증 없음).
  - `docs/LENS_DEV_PLAYBOOK.md` — 문제로그 #17(같은 데이터·다른 시각의 §0-7 결정적 사례).
  - (STEP 522 미커밋분) `lib/technical.ts`(신규 공유엔진), `scripts/backtest_technical.ts`.
- 이 STEP = 빌드 + 검증 + 커밋.

## 0) 확인
```bash
cd ~/stock-terminal && grep -c "평균회귀'는 미작동" lib/lenses.ts && grep -c "검증·약함" docs/LENS_STRENGTH_MAP.md && grep -c "| 17 |" docs/LENS_DEV_PLAYBOOK.md && ls -la lib/technical.ts scripts/backtest_technical.ts
```
- [ ] 각각 1 이상, 두 파일 존재.

## 1) 빌드 + 클린 재시작
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
```
- [ ] "Compiled successfully".

## 2) 검증 (localhost:3333)
```bash
sleep 12
curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); t=[x for x in d['lenses'] if x['key']=='technical'][0]; print('note:',(t.get('note') or '')[:70])"
```
- [ ] note 앞부분에 "검증 결과" + "평균회귀'는 미작동".

## 3) 커밋 (STEP 522 인프라 + 523 정직화 함께)
```bash
git add lib/technical.ts lib/lenses.ts scripts/backtest_technical.ts docs/LENS_STRENGTH_MAP.md docs/LENS_DEV_PLAYBOOK.md docs/STEP_522_COMMAND.md docs/STEP_523_COMMAND.md && git commit -m "feat(lens): 기술 검증 반영 — RSI 평균회귀 기각·200일선 약한 우위, lib/technical 공유엔진 (STEP 522·523) / 무료 렌즈 5종 판정 완결" && git push
```

## 🏁 여기까지 = 무료 렌즈층 완결 (5종 전부 정직 판정)
| 렌즈 | 판정 | 근거 |
|---|---|---|
| 모멘텀(12-1) | ✅ 검증 | +2.4%p/년 ($5+) |
| 저변동성 | ✅ 검증 | 저−고 +7.4%/년·위험 25% ($5+) |
| F-Score | ✅ 검증 | 재무 건전성 해석(수익예측 아님) |
| 밸류(가치) | ✅ 검증 | E/P +10.2%p/년 · B/M 조건부 |
| 기술(RSI·MA) | ⚪ 참고용 | RSI 평균회귀 기각 · 200일선 약한 +3%/년 |
- 모든 판정이 적합영역 지도·플레이북(#1~17)과 일치. 데이터·엔진·검증 토대 durable.

## ▶ 다음 후보 (STEP 524 — Cowork에서 방향)
- (a) KR/글로벌 렌즈 확장 — 가격기반(모멘텀·저변동·기술)은 즉시, 재무기반(F·밸류)은 DART(KR) 필요.
- (b) 새 기법 추가 — 퀄리티(ROE·마진)·마법공식 등(플레이북 틀 반복).
- (수익화·UX·유료 AI보기는 계속 뒤로 — 전 기법 검증 완료 후.)
