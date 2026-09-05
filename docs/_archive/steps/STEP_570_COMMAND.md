<!-- 2026-07-04 -->
# STEP 570 — 공용 렌즈 엔진 추출 + value/state 노출 (스크리닝 토대 1단계)

> **목표**: 렌즈 계산을 `lib/lensCompute.ts` 한 함수로 모아 **온디맨드 카드(/api/lens)와 앞으로의 배치 프리컴퓨트(스크리닝)가 같은 엔진을 공유**하게. + 각 렌즈에 언어중립 `value`/`state` 노출(스크리닝·랭킹용). **사용자 눈에 보이는 변화 없음**(순수 토대) — /api/lens 출력은 그대로 + 필드 2개 추가.
> **전제 HEAD**: `928ca2d`(STEP 569 문서 매듭). Cowork이 소스 이미 수정 → Claude Code는 **빌드 검증 + 클린 재시작 + 커밋**.
> ⚠️ **API 라우트 변경** → Turbopack 자동갱신 안 됨 → 반드시 클린 재시작(`rm -rf .next`).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_570_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 Cowork이 이미 수정한 것
- `lib/lensCompute.ts` (신규) — `computeSymbolLenses(symbol, locale)`: 야후 3콜(chart·quote·fundamentalsTimeSeries)로 7팩터+F-Score 산출. **next/server import 없음**(프레임워크 무관 → tsx/크론서도 호출 가능).
- `lib/lenses.ts` — `LensRead`에 `value?`/`state?`(언어중립) 추가 + 6렌즈에 배선(momentum=12-1%·mState 등).
- `app/api/lens/route.ts` — 계산 로직 제거, `computeSymbolLenses` 호출하는 **얇은 캐시 래퍼**로.

## 0) 배선 확인
```bash
cd ~/stock-terminal
grep -cE "^\s+(value|state):" lib/lenses.ts   # 12 기대(6렌즈×2)
grep -c "computeSymbolLenses" app/api/lens/route.ts lib/lensCompute.ts   # 라우트1·엔진1+
grep -c "next/server" lib/lensCompute.ts   # 0 기대(프레임워크 무관)
```
- [ ] value/state 12 · computeSymbolLenses 배선 · lensCompute에 next/server 0.

## 1) 타입 검사 + 빌드
```bash
npx tsc --noEmit; echo "tsc EXIT=$?"
```
- [ ] `tsc EXIT=0`.
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed" | head -8
```
- [ ] "Compiled successfully".

## 2) 클린 재시작 (라우트 변경)
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
```

## 3) 검증 — /api/lens 출력 동일 + value/state 추가
```bash
sleep 12
curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); print('name:', d.get('name'), '| price:', d.get('price'), '| fscore:', 'O' if d.get('fscore') else 'X'); [print(f\"  {x['key']:12} state={x.get('state')!s:12} value={x.get('value')}\") for x in d['lenses']]"
```
- [ ] name·price·fscore 정상(기존과 동일 형태) + **각 렌즈에 state·value 출력**(momentum state=up/down/flat·value=12-1% · quality state=high/mid/low/na·value=GP/A% 등).

## 4) (보너스) 배치 준비 증명 — Next 밖에서 엔진 호출
```bash
npx tsx -e "import('./lib/lensCompute.ts').then(m=>m.computeSymbolLenses('AAPL').then(r=>console.log('OK', r.name, r.lenses.map(l=>l.key+':'+l.state+'='+l.value).join(' | '))))" 2>&1 | tail -3
```
- [ ] `OK Apple Inc. momentum:... | ...` 출력 = 프레임워크 밖에서도 계산됨(배치·크론 준비 완료). ※ tsx -e 이슈로 실패해도 구조상(next/server 0) 배치 준비는 확인됨 — 3)이 통과면 OK.

## 5) 커밋 + push
```bash
git add lib/lensCompute.ts lib/lenses.ts app/api/lens/route.ts docs/STEP_570_COMMAND.md && git commit -m "refactor(lens): 공용 계산 엔진 lib/lensCompute 추출 + LensRead value/state 노출 — 카드·배치 프리컴퓨트 공유(스크리닝 토대 1단계) (STEP 570)" && git push
```
> ※ 이번 STEP은 소스 3개(lensCompute 신규·lenses·route)만 변경 — page.tsx 등 다른 파일은 안 건드림.

## ✅ 여기까지 = 엔진 하나로 통일(카드=배치 동일 계산) + 스크리닝용 value/state 준비.
## ▶ 다음 (STEP 571) = `lens_scores` 테이블(028 마이그레이션) + 시드 스크립트로 소규모(~30종목) 프리컴퓨트·검증 → 파이프라인 증명. 그 뒤 572=크론·유니버스 확장(2단 스케줄), 573=스크리닝 UI.
