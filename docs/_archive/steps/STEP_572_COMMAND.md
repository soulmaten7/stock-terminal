<!-- 2026-07-04 -->
# STEP 572 — 배치 엔진(시총 상위 N) + 로컬 유니버스 확장 (스크리닝 토대 3단계)

> **목표**: 시드 30종목 → **시총 상위 ~1,000 종목**으로 확장. 배치 엔진 `lib/lensPrecompute`가 상위 N을 골라 7팩터를 미리계산·저장. **로컬 tsx로 실제 채워 검증**(크론 배선은 검증 뒤 STEP 573).
> **전제 HEAD**: `41b19f0`(STEP 571). Cowork이 엔진·러너 작성 완료 → Claude Code는 **tsc + 로컬 실행(백그라운드) + 검증 + 커밋**.
> ⚠️ 무료 야후는 6,121 전종목 펀더멘털을 매번 못 긁음 → 시총 상위 N 제한(정직·나중 확장). `lens_scores` 테이블은 이미 존재(STEP 571).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_572_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 Cowork이 이미 만든 것
- `lib/lensPrecompute.ts` (신규) — `computeLensScores(topN, concurrency)`: 배치 quote로 시총 상위 N 랭킹 → `computeSymbolLenses` 동시 실행(기본 6) → **100행마다 즉시 저장(flush·부분 내구성)**.
- `scripts/precompute_lens.ts` (교체) — 엔진 러너. `npx tsx scripts/precompute_lens.ts [N]`(기본 1000).

## 0) 타입 검사
```bash
cd ~/stock-terminal && npx tsc --noEmit; echo "tsc EXIT=$?"
```
- [ ] `tsc EXIT=0`.

## 1) 백그라운드 실행 (상위 1000 — 야후 조회·계산 수 분 소요)
```bash
cd ~/stock-terminal && nohup npx tsx scripts/precompute_lens.ts 1000 > /tmp/lens_precompute.log 2>&1 &
echo "시작됨 PID=$!"
```

## 2) 폴링 — 끝날 때까지 로그 관찰(최대 ~8분)
```bash
cd ~/stock-terminal
for i in $(seq 1 16); do sleep 30; echo "=== $((i*30))s ==="; tail -3 /tmp/lens_precompute.log; grep -q "DONE" /tmp/lens_precompute.log && { echo "완료!"; break; }; done
```
- [ ] 마지막에 `DONE — 유니버스 1000 · 저장 N행 · ...초` (N은 800~1000, 야후 실패분 제외). "저장 누계" 로그가 100씩 증가.
- [ ] 에러(`SUPABASE_...`·`upsert`) 없어야. (있으면 로그 Cowork에 공유.)

## 3) DB 저장 검증 (anon 공개 읽기)
```bash
source .env.local 2>/dev/null
echo "총 행수:"; curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lens_scores?select=symbol" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Prefer: count=exact" -I | grep -i content-range
echo "모멘텀 강세(up) + 저PER 상위 5:"; curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lens_scores?select=symbol,momentum_state,valuation_value,quality_state&momentum_state=eq.up&order=valuation_value.asc.nullslast&limit=5" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" | python3 -m json.tool
```
- [ ] content-range에 총 행수 ~1000(시드 30 포함 upsert). 조건 스크리닝 쿼리(모멘텀 up & 저PER)가 실제로 종목을 반환 = 스크리닝 준비 완료.

## 4) 커밋 + push
```bash
git add lib/lensPrecompute.ts scripts/precompute_lens.ts docs/STEP_572_COMMAND.md && git commit -m "feat(screening): 배치 엔진 lib/lensPrecompute(시총 상위 N) + 러너 — 유니버스 30→~1000 확장, 부분 내구성 flush (STEP 572)" && git push
```

## ✅ 여기까지 = 스크리닝 유니버스 ~1000종목 실데이터. 조건 쿼리 즉시 가능.
## ▶ 다음 (STEP 573) = 크론 배선(`/api/cron/lens-scores` + vercel.json `0 20 * * *`)으로 매일 자동 갱신. 그 뒤 574 = 스크리닝 UI(조건으로 종목 찾기 화면).
