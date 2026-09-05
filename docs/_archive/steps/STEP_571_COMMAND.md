<!-- 2026-07-04 -->
# STEP 571 — lens_scores 테이블 + 시드 스크립트 (스크리닝 토대 2단계·파이프라인 증명)

> **목표**: 공용 엔진(STEP 570)으로 **~30 종목의 7팩터를 실제로 미리 계산해 `lens_scores` 테이블에 저장** → 스크리닝 파이프라인을 엔드투엔드로 증명(작게). 전종목·크론 확장은 STEP 572.
> **전제 HEAD**: `1ae2193`(STEP 570). Cowork이 **테이블 생성(MCP)·마이그레이션 파일·시드 스크립트 완료** → Claude Code는 **시드 실행 + 커밋**만.
> ✅ **테이블은 이미 존재**: `lens_scores`(19컬럼)를 Cowork이 Supabase MCP로 Trillion 프로젝트(`ccbwxcszdoyjxvckedfp`)에 생성 완료. Claude Code가 마이그레이션 적용할 필요 없음(파일은 아카이브·커밋만).

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_571_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 Cowork이 이미 만든 것
- `supabase/migrations/028_lens_scores.sql` — 테이블 정의(아카이브·재현용). **이미 MCP로 적용됨**.
- `scripts/precompute_lens.ts` — 30 종목 `computeSymbolLenses` → 팩터 value/state 추출 → `lens_scores` upsert(onConflict symbol). dotenv로 `.env.local` 로드(service-role 쓰기).

## 0) 파일 확인
```bash
cd ~/stock-terminal
ls -1 supabase/migrations/028_lens_scores.sql scripts/precompute_lens.ts
grep -c "computeSymbolLenses\|lens_scores" scripts/precompute_lens.ts
```
- [ ] 두 파일 존재 · 스크립트에 엔진·테이블 참조.

## 1) 시드 실행 (야후 조회 → DB 저장)
```bash
npx tsx scripts/precompute_lens.ts
```
- [ ] 종목별 `OK mom=.. val=.. qual=.. fscore=..` 로그가 죽 뜨고, 마지막에 **`UPSERT OK: N행 저장`**(N≈28~30, 일부 종목 야후 실패 가능).
- [ ] `UPSERT ERROR`나 `SUPABASE_SERVICE_ROLE_KEY` 관련 에러 없어야. (에러 시 로그 그대로 Cowork에 공유.)

## 2) 저장 검증 (공개 읽기 정책 → anon 키로 조회)
```bash
source .env.local 2>/dev/null; curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/lens_scores?select=symbol,momentum_state,quality_state,valuation_state,fscore_state&order=quality_value.desc.nullslast&limit=8" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" | python3 -m json.tool
```
- [ ] 8행 정도 JSON 출력(퀄리티 높은 순) — 각 행에 symbol + 각 state. = 배치 계산이 DB에 실제 저장됨.

## 3) 커밋 + push
```bash
git add supabase/migrations/028_lens_scores.sql scripts/precompute_lens.ts docs/STEP_571_COMMAND.md && git commit -m "feat(screening): lens_scores 테이블 + 시드 프리컴퓨트 스크립트 — 공용 엔진으로 ~30종목 7팩터 미리계산·저장(파이프라인 증명) (STEP 571)" && git push
```
> ※ 코드/스크립트만 커밋(빌드 불필요 — 스크립트는 Next 밖 tsx). 안심하려면 `npx tsc --noEmit`만 확인(EXIT=0).

## ✅ 여기까지 = 공용 엔진 → DB 미리계산 파이프라인 엔드투엔드 증명(소규모).
## ▶ 다음 (STEP 572) = 유니버스 확장 + 크론(2단 스케줄: 가격팩터 매일 / 펀더멘털 주기적) → 전 종목 자동 갱신. 그 뒤 573 = 스크리닝 UI(조건으로 종목 찾기).
