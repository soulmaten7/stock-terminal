<!-- 2026-07-02 -->
# STEP 509 — 모멘텀 렌즈 canonical 12-1 정리 + 검증 문구 (모멘텀 1사이클 완주)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_509_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
백테스트(STEP 508: 프리미엄 +4.1%/년, 양수·완만·비단조)를 반영해 모멘텀 렌즈를 **canonical 12-1** 중심으로 정리 + 정직한 검증 문구.
- **Cowork이 `lib/lenses.ts` 이미 수정함**: `momentumLens`가 `lib/momentum`(12-1) 공유 → 장기=검증된 12-1 라벨, detail에 12-1모멘텀%, note에 백테스트 결과. 이 STEP = **빌드 + 클린 재시작 + 검증 + 커밋**.
- ⚠️ lib은 /api/lens(서버)가 씀 → 클린 재시작.

## 0) 파일 확인
```bash
cd ~/stock-terminal
ls -la lib/momentum.ts lib/lenses.ts
```

## 1) 빌드 + 클린 재시작
```bash
npm run build
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 2) 검증 (localhost:3333)
```bash
sleep 8
curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); m=[x for x in d['lenses'] if x['key']=='momentum'][0]; print('name:', m['name']); print('단기:', m['short'], '| 장기:', m['long']); print('detail:', m['detail']); print('note:', m.get('note'))"
```
- [ ] name "모멘텀(12-1)", detail에 **12-1모멘텀%** 포함, note에 백테스트 문구.
- [ ] `/stock/NVDA` 모멘텀 카드에 12-1 + 검증 노트 노출.

## 3) 커밋
```bash
git add lib/lenses.ts && git commit -m "feat(lens): 모멘텀 렌즈 canonical 12-1 + 백테스트 검증 문구(+4%p) (STEP 509)" && git push
```

## ✅ 기록 — 모멘텀 1사이클 완주 & 두 기법 대비 확립
- **모멘텀**: 정의(12-1)→데이터(가격)→엣지→**검증(+4.1%/년 프리미엄)**→표현. "검증되는 신호"의 첫 긍정 사례.
- **F-Score(건전성, 대형주 예측력 약함) vs 모멘텀(완만하지만 검증된 방향성)** — 렌즈별 신뢰도가 다르다는 걸 정직하게 보여주는 구조 확립. 이게 "정직한 다중 렌즈" 정체성의 실제 구현.
- 방법론(정의→데이터→엣지→검증→표현 + 정직 문구)이 2개 기법으로 확립 → 이후 기법은 이 틀 반복.

## ▶ 다음 후보
- 다음 기법 1개(예: 저변동성·퀄리티·듀얼모멘텀) 동일 틀로.
- 또는 KR/글로벌 확장(모멘텀은 가격만이라 4개국 즉시 적용 가능 — 검증도 각국 가격으로).
- 또는 제품화 마감(무료 렌즈 세트 + 유료 "AI보기" LLM 종합) 로 방향 전환.
