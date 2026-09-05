<!-- 2026-07-03 -->
# STEP 568 — "이 기법 방향" 층 (그 기법 방법대로의 outlook) + 제품 청사진 로그

> 전략 확정: 7개 팩터가 측정에서 멈추지 않고 **그 기법 '방법대로'의 방향**까지 — [시간축 단기/장기 · 유리/불리/중립 · 정직 꼬리표]. **예측 아님**(역사적 base-rate 경향). 모든 기법이 수익 방향은 아님(저변동=위험·F-Score=건전성·기술=상태 축 유지). 제품 청사진(원자→방향→조합전략→TRAI)도 `BUSINESS_STRATEGY` 결정 로그에 남김.
> Cowork이 소스 수정 완료(tsc EXIT=0). Claude Code는 **빌드 + 재시작 + 눈검수 + 커밋**. ⚠️ API에 outlook 필드 추가 → 클린 재시작.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_568_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (Cowork이 이미 수정)
- `lib/lensCopy.ts` — `LENS_OUTLOOK`(7기법 상태별 "이 기법 방향" ko/en) 추가.
- `lib/lenses.ts` — `LensRead.outlook` + `outlookOf()`, 6렌즈에 부착.
- `app/stock/[symbol]/page.tsx` — 스펙트럼 밑에 **"이 기법 방향"** 줄(기존 쉬운해석 대체·중복 제거). F-Score도 동일.
- `docs/BUSINESS_STRATEGY.md` — 🗺️ 제품 청사진(4층: 원자→방향→조합전략→TRAI) 결정 로그.

## 0) 확인
```bash
cd ~/stock-terminal && grep -c "LENS_OUTLOOK\|outlook\|이 기법 방향" app/stock/\[symbol\]/page.tsx lib/lenses.ts lib/lensCopy.ts
```
- [ ] 3파일 모두 1+.

## 1) 빌드 + 클린 재시작
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
```
- [ ] "Compiled successfully".

## 2) 검증(API) + 눈검수(스크린샷)
```bash
sleep 12
curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(x['key'],'→',x.get('outlook')) for x in d['lenses']]"
```
- [ ] 각 렌즈에 outlook 출력(momentum→"단기~중기 유리한 편…", valuation→"장기 불리한 편…" 등).
- 브라우저 `/stock/NVDA` 각 기법 펼침:
  - [ ] 스펙트럼 밑에 **"이 기법 방향"** — 모멘텀/퀄리티=유리, 밸류/자산성장=장기 불리, 저변동=위험, F-Score=건전성 (엇갈림 드러남).
  - [ ] 모바일 안 깨짐.
- 스크린샷 Cowork 공유.

## 3) 커밋
```bash
git add lib/lensCopy.ts lib/lenses.ts app/stock/\[symbol\]/page.tsx docs/BUSINESS_STRATEGY.md docs/STEP_568_COMMAND.md && git commit -m "feat(lens): '이 기법 방향' 층 — 그 기법 방법대로의 outlook(시간축·유리/불리·정직 꼬리표·예측 아님) + 제품 청사진 로그 (STEP 568)" && git push
```

## ✅ 여기까지 = 측정 → 그 기법 방법대로의 방향까지 (사용자가 따로 분석 안 해도)
## ▶ 다음 (청사진 순서)
- 세부 문구 다듬기(계속) · 전 종목 하루 1번 미리 계산(스크리닝 토대) · 검증된 조합 전략(가치+모멘텀 등) · 맨 마지막 TRAI.
