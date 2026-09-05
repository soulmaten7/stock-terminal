<!-- 2026-07-03 -->
# STEP 555 — 렌즈 카드 직관화 (판정 문장 + 숫자 병기 + 상단 공통 전제)

> 제품 핵심 가치 확정: 일반 사용자는 "자산성장 85.31%"가 좋은지 모름 → **각 기법이 이 종목을 어떻게 읽는지 직관 문장**으로 번역. 동시에 **정확한 수치는 '근거 수치'로 그대로**(숫자로 판단하는 사용자 배려 — 축소 X). "이 기법 시각·예측 아님"은 **상단에 한 번** 공통 명시.
> Cowork이 소스 전부 수정 완료(타입체크 `tsc --noEmit` EXIT=0). Claude Code는 **빌드 + 재시작 + 눈검수 + 커밋**.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_555_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (Cowork이 이미 작성)
- `lib/lensCopy.ts` — `LENS_READINGS`(7기법 × 상태별 `{phrase, plain}` · ko/en) 추가.
- `lib/lenses.ts` — `LensRead.verdict` 필드 + `readOf()` + 6개 렌즈 함수가 상태 계산 후 verdict 부착(모멘텀·저변동·밸류·퀄리티·자산성장·기술).
- `app/stock/[symbol]/page.tsx` — 카드에 **판정 문장(색조)+쉬운 해석** 노출, 요약은 작게, **근거 수치 라벨+구분선(숫자 그대로)**, 상단 전제 문구 강화, **F-Score 카드에도 판정 문장**.
- ⚠️ API 라우트는 안 바뀜(엔진만). 그래도 클린 재시작 권장.

## 0) 확인
```bash
cd ~/stock-terminal && grep -c "LENS_READINGS" lib/lensCopy.ts lib/lenses.ts app/stock/\[symbol\]/page.tsx && grep -c "verdict" lib/lenses.ts
```
- [ ] LENS_READINGS 3파일 각 1+, lenses verdict 7+(타입+6렌즈).

## 1) 빌드 + 클린 재시작
```bash
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed"
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
```
- [ ] "Compiled successfully" · 에러 0.

## 2) API 검증 (verdict 노출 · ko/en)
```bash
sleep 12
echo "== ko ==" && curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(x['key'],'→',x.get('verdict',{}).get('phrase') if x.get('verdict') else 'NONE') for x in d['lenses']]"
echo "== en ==" && curl -s "http://localhost:3333/api/lens?symbol=NVDA&lang=en" | python3 -c "import sys,json; d=json.load(sys.stdin); m=[x for x in d['lenses'] if x['key']=='assetgrowth']; print(m[0]['verdict']['phrase'],'|',m[0]['verdict']['plain'][:40]) if m and m[0].get('verdict') else print('NO')"
```
- [ ] ko: 각 렌즈에 판정 문장 출력(momentum→"강하게 오르는 흐름" 등, NONE 아님).
- [ ] en: assetgrowth → "Expanding aggressively | It's growing assets fast…".

## 3) 눈검수 (스크린샷 — 이게 핵심)
- 브라우저 `/stock/NVDA`:
  - [ ] 상단: "각 기법이 이 종목을 보는 시각… 예측 아님… 정확한 수치도 함께" 전제 문구.
  - [ ] 각 카드: **판정 문장**(민트=우호·앰버=주의·기본=중립) + **쉬운 해석 한 줄** + 아래 **"근거 수치 · GP/A% 74.21"처럼 정확한 값 그대로**.
  - [ ] F-Score 카드도 판정 문장(예: "재무가 튼튼한 편").
- **스크린샷을 Cowork에 공유** → 사람이 "직관적으로 이해되나" 최종 판단.

## 4) 커밋
```bash
git add lib/lensCopy.ts lib/lenses.ts app/stock/\[symbol\]/page.tsx docs/STEP_555_COMMAND.md && git commit -m "feat(lens): 카드 직관화 — 기법별 판정 문장(ko/en)+쉬운 해석 + 정확한 근거 수치 병기 + 상단 '각 기법 시각·예측 아님' 전제 (STEP 555)" && git push
```

## ✅ 여기까지 = 렌즈 결과를 '직관 + 정확한 수치' 둘 다로 — 우리 플랫폼 핵심 가치
## ▶ 다음
- 스크린샷 검수 후 문구 미세 조정(필요 시) → 세션 문서 갱신.
- 그 다음: 발생액(Accruals) 검증, 또는 일본어·중국어 카피, 배포+모바일.
