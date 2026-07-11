<!-- 2026-07-02 -->
# STEP 497 — 결정론 렌즈 엔진 MVP (무료층 첫 조각: 모멘텀·기술·밸류, 온디맨드)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_497_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
"AI 렌즈"의 **무료 결정론층 첫 조각**. 심볼 하나에 대해 야후 데이터로 **모멘텀·기술·밸류에이션** 3개 렌즈를 계산해 단기/장기 방향 라벨 + 근거 수치를 JSON으로 반환. **새 API 키 불필요**(야후), 온디맨드 + 30분 캐시.
- **Cowork이 파일 2개 이미 작성함**: `lib/lenses.ts`(순수 계산), `app/api/lens/route.ts`(야후 조달+계산). 이 STEP = **빌드 + 검증 + 커밋**. (UI는 다음 STEP)
- ⚠️ 새 API 라우트 → 클린 재시작.

## 0) 파일 확인
```bash
cd ~/stock-terminal
ls -la lib/lenses.ts app/api/lens/route.ts
```
> 둘 다 있어야 함. 없으면 중단·Cowork에 알림.

## 1) 빌드 + 클린 재시작
```bash
npm run build
```
> 타입 에러 시 중단·보고(lib/lenses.ts·route 타입).
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 2) 검증 (localhost:3333) — 4개국 심볼로
```bash
sleep 6
for s in NVDA 005930.KS 7203.T 0700.HK; do
  echo "== $s =="
  curl -s "http://localhost:3333/api/lens?symbol=$s" | python3 -m json.tool
done
```
- [ ] 각 심볼에 `lenses` 3개(모멘텀·기술·밸류) — `short`/`long` 라벨 + `detail` 수치(1·3·6·12개월%, RSI, 200일선대비, 52주위치, PER, PBR).
- [ ] 미국(NVDA)·한국(삼성 005930.KS)·일본(도요타 7203.T)·홍콩(텐센트 0700.HK) 다 값이 나오는지(야후 커버).
- [ ] 라벨이 상식과 부합하는지 눈으로 체크(예: 최근 급등주 모멘텀=강세, 고PER=고평가).

## 3) 커밋
```bash
git add lib/lenses.ts app/api/lens/route.ts && git commit -m "feat(lens): 결정론 렌즈 엔진 MVP — 모멘텀·기술·밸류 온디맨드 API(/api/lens) (STEP 497)" && git push
```

## ⚠️ 노트 / 다음
- 이건 **엔진**만. 다음 STEP: (1) 종목 클릭 시 렌즈 표시 UI, (2) 렌즈 추가(F-Score·Z·DCF — 재무제표 필요 → KR은 DART 키, US/JP/CN은 야후 재무), (3) 유료 "AI보기"(LLM 종합) 온디맨드.
- 원칙 재확인: 예측 아님(해석·방향성). 결정론이라 서버비 거의 0 → 무료층.
- PER 밸류 라벨은 러프(섹터 무시) — 과거 밴드·섹터 상대비교는 후속.
