<!-- 2026-07-04 -->
# STEP 575 — F-Score "이익의 질" 근거 문구 픽스 (눈검수 반영)

> **문제**: 눈검수에서 "이익의 질" 근거가 `현금 102.7B > 순익 120.1B`로 떴는데, 102.7 < 120.1이라 `>`가 사실과 반대로 보임(이 항목 ✗의 원인이 CFO<순익인데 노트가 거짓말처럼 보임). → 중립 구분자 `·`로 교체(값만 표시, 통과/미달은 ✓✗+라벨이 전달).
> **전제 HEAD**: `4e2496f`(STEP 574). Cowork이 `lib/fscore.ts` 한 줄 수정 완료 → Claude Code는 **빌드 + 클린 재시작 + 커밋**.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_575_COMMAND.md 파일 내용대로 실행해줘
```

## 0) 수정 확인
```bash
cd ~/stock-terminal && grep -n "현금 .* · 순익" lib/fscore.ts
```
- [ ] `현금 ${...} · 순익 ${...}` (가운뎃점 · · `>` 아님).

## 1) 빌드 + 클린 재시작
```bash
npx tsc --noEmit; echo "tsc EXIT=$?"
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed" | head -5
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
sleep 12
```
- [ ] tsc EXIT=0 · Compiled successfully.

## 2) 검증
```bash
curl -s "http://localhost:3333/api/lens?symbol=NVDA" | python3 -c "import sys,json; d=json.load(sys.stdin); c=[x for x in (d.get('fscore') or {}).get('criteria',[]) if x['key']=='accrual'][0]; print('이익의 질 note:', c['note'])"
```
- [ ] note에 `·` 표시(`>` 없음).

## 3) 커밋 + push
```bash
git add lib/fscore.ts docs/STEP_575_COMMAND.md && git commit -m "fix(lens): F-Score '이익의 질' 근거 구분자 '>' → '·'(미달 시 사실 반대로 보이던 문제) (STEP 575)" && git push
```

## ✅ 여기까지 = F-Score 카드 눈검수 픽스 완료. 다음 = Cowork 모바일 눈검수 → 나머지 6개 카드 헌장 적용.
