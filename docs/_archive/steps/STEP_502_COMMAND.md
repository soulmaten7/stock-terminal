<!-- 2026-07-02 -->
# STEP 502 — 피오트로스키 F-Score 엔진 + 렌즈 페이지 표시 (첫 "제대로 된" 렌즈)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_502_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
확정된 필드(STEP 501)로 **F-Score 9개 기준을 정확히 계산**하고 렌즈 페이지에 **9개 항목 투명 공개**. 비금융주=0~9점, 금융주=미지원(정직).
- **Cowork이 아래 3개 이미 작성/수정함** — 빌드·검증·커밋만:
  - `lib/fscore.ts` (신규, 9기준 순수계산)
  - `app/api/lens/route.ts` (fundamentalsTimeSeries fetch + fscore 추가)
  - `app/stock/[symbol]/page.tsx` (F-Score 카드)
- ⚠️ API 라우트 수정 → 클린 재시작.

## 0) 파일 확인
```bash
cd ~/stock-terminal
ls -la lib/fscore.ts app/api/lens/route.ts "app/stock/[symbol]/page.tsx"
```

## 1) 빌드 + 클린 재시작
```bash
npm run build
```
> 타입 에러 시 중단·보고(특히 fscore.ts 타입 / route의 FRow import).
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 2) 검증 (localhost:3333) — 계산 정확성 눈으로 확인
```bash
sleep 8
for s in NVDA JNJ JPM 005930; do
  echo "===== $s ====="
  curl -s "http://localhost:3333/api/lens?symbol=$s" | python3 -c "
import sys,json
d=json.load(sys.stdin); f=d.get('fscore')
if not f: print(' fscore 없음'); sys.exit()
if not f.get('supported'): print(' 미지원:', f.get('reason')); sys.exit()
print(' 점수:', f['score'],'/',f['max'], f['grade'], '(',f.get('asOf'),')')
for c in f['criteria']: print('   ', '✓' if c['pass'] else '✗', c['label'], '—', c['note'])
"
done
```
검증 포인트 (각 기준의 **통과/실패가 근거 수치와 일치**하는지 눈으로):
- [ ] **NVDA·JNJ** = 0~9점 + 9개 기준 각각 표시. 각 항목의 ✓/✗가 옆 수치와 논리적으로 맞는지(예: "③ ROA 개선 — 64.9% → 58.3%"면 ✗가 맞음).
- [ ] **JPM(은행)** = "미지원"(금융업종). 
- [ ] **005930(삼성)** = 야후 KR 재무가 있으면 점수, 없으면 미지원 — 둘 중 뭐가 나오는지 확인(KR 정식 지원은 나중 DART).
- [ ] 브라우저 `/stock/NVDA` → 상단에 **F-Score 카드**(점수 + 9개 항목 ✓/✗ + 근거) + 아래 기존 3개 렌즈.

> ⚠️ 이 시점엔 "F-Score 계산이 정확한가"만 확인(눈으로). "이 점수가 미래를 맞히나"는 **STEP 503 백테스트**에서 검증.

## 3) 커밋
```bash
git add lib/fscore.ts app/api/lens/route.ts "app/stock/[symbol]/page.tsx" && git commit -m "feat(lens): 피오트로스키 F-Score 엔진(9기준) + 렌즈 페이지 표시 — 첫 정식 재무 렌즈 (STEP 502)" && git push
```

## ⚠️ 다음 — STEP 503 (검증/백테스트)
- 과거 특정 시점의 F-Score로 종목을 고득점(7~9)/저득점(0~3) 그룹으로 나눠 **이후 1년 수익률 분포**를 비교 → "이 신호가 실제로 유효했나" 정직하게 측정(피오트로스키 논문 재현). 이게 통과해야 F-Score 렌즈가 "완성".
- 그 후 KR 정식화(DART) → 다음 기법 1개.
