<!-- 2026-07-04 -->
# STEP 573 — 렌즈 점수 크론 배선 (매일 자동 갱신)

> **목표**: STEP 572 배치 엔진을 **크론으로 매일 자동 실행** → `lens_scores`가 손 안 대도 갱신되게. us-perf 크론과 동일 패턴(CRON_SECRET 인증).
> **전제 HEAD**: `60f78ae`(STEP 572). Cowork이 크론 라우트 + vercel.json 완료 → Claude Code는 **빌드 + 인증 가드 검증 + 커밋**.
> ⚠️ 새 API 라우트 → 클린 재시작. 전체 실행(~224초)은 STEP 572에서 엔진 이미 검증했으니 여기선 **인증 가드(401)만** 빠르게 확인(실컴퓨트 재실행 안 함).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_573_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 Cowork이 이미 만든 것
- `app/api/cron/lens-scores/route.ts` (신규) — `Bearer $CRON_SECRET` 인증 → `computeLensScores(1000)` → JSON. `maxDuration=300`.
- `vercel.json` — 크론 `{ "/api/cron/lens-scores", "0 20 * * *" }` 추가(20:00 UTC, 기존 크론과 안 겹침).

## 0) 파일·스케줄 확인
```bash
cd ~/stock-terminal
python3 -c "import json; c=json.load(open('vercel.json'))['crons']; print('크론', len(c), '개'); [print(' ', x['path'], x['schedule']) for x in c]"
grep -c "CRON_SECRET\|computeLensScores" app/api/cron/lens-scores/route.ts
```
- [ ] 크론 7개 · lens-scores `0 20 * * *` 포함 · 라우트에 인증·엔진 참조.

## 1) 타입 검사 + 빌드
```bash
npx tsc --noEmit; echo "tsc EXIT=$?"
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed|/api/cron/lens-scores" | head -8
```
- [ ] `tsc EXIT=0` · "Compiled successfully" · 라우트가 빌드 목록에 잡힘.

## 2) 클린 재시작 (새 라우트)
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
sleep 12
```

## 3) 인증 가드 검증 (401 — 실컴퓨트 안 돌아감)
```bash
echo "인증 없음 →"; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3333/api/cron/lens-scores"
echo "틀린 토큰 →"; curl -s -o /dev/null -w "%{http_code}\n" -H "authorization: Bearer wrong" "http://localhost:3333/api/cron/lens-scores"
```
- [ ] 둘 다 **401**(인증 실패 시 즉시 반환 = 아무나 못 돌림·가드 정상). ※ 올바른 토큰으로 호출하면 ~224초 걸려 전체 재계산 — 검증엔 불필요(STEP 572서 엔진 검증됨).

## 4) 커밋 + push
```bash
git add app/api/cron/lens-scores/route.ts vercel.json docs/STEP_573_COMMAND.md && git commit -m "feat(screening): 렌즈 점수 크론 /api/cron/lens-scores + vercel.json(매일 20:00 UTC) — 자동 갱신 (STEP 573)" && git push
```
> 배포되면 Vercel이 매일 20:00 UTC에 자동 호출 → lens_scores 갱신. (배포 후 Vercel 대시보드 Cron 탭에서 확인 가능.)

## ✅ 여기까지 = 스크리닝 데이터가 매일 자동 갱신(무인). 토대 완성.
## ▶ 다음 (STEP 574) = 스크리닝 UI — "조건으로 종목 찾기" 화면(예: 모멘텀 강세 + 저PER + 우량 재무). lens_scores를 anon 공개 읽기로 필터·정렬해 카드 리스트. 이게 청사진 ②(전종목 미리계산)의 사용자 대면 완성.
