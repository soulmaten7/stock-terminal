# STEP 750 — cn-perf 타임아웃 근본 수정: 8분할 슬라이스 + 시간 예산 가드

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet — 2파일)

**전제 상태**: 코드 HEAD `3925f2c`(STEP 749) · 트리 클린

**원인(07-18 실측)**: `cn-perf`가 **매 실행 FUNCTION_INVOCATION_TIMEOUT(300초)** → 7/9부터 9일 미갱신. 구조 = 7,098종목을 하루 1방(동시 12)으로 처리하는데, A주 3,868종목의 东方财富 콜이 지연/hang이면 콜당 8초 타임아웃이 쌓여 300초를 초과(3,868×8÷12≈2,580초). 소스는 데이터센터 IP 프로브에서 정상 응답(0.4초) — Vercel IP 차단 또는 지연 누적 어느 쪽이든, **하루 1방 구조 자체가 취약**.

**수정 방침**: 소스 교체가 아니라 **구조를 견디게** — ① 3시간마다 8분할(회당 ~890종목·정상 ~75초) ② 회당 220초 시간 예산(초과 시 새 작업 안 집고 부분 upsert — 무저장보다 낫다) ③ A주 콜 타임아웃 8초→5초. 상태 저장 없는 시각 기반 파티션(크론 지연에도 안전). 화면(cn-list)은 심볼별 조인이라 부분 갱신 무해.

---

## 수정 1 — `lib/cnPerf.ts`

### 1-a) eastmoney 콜 타임아웃 축소

```ts
      signal: AbortSignal.timeout(8000),
```
→
```ts
      signal: AbortSignal.timeout(5000), // STEP 750: hang 소스가 예산을 태우는 속도 축소
```

### 1-b) `computeCnPerf` 슬라이스+예산 구조로 교체

기존:
```ts
export async function computeCnPerf(): Promise<{ ok: true; computed: number; at: string }> {
  // 약 280 달력일 룩백 — 6개월(126 거래일) + 비거래일 버퍼 충분
  const LOOKBACK_DAYS = 400; // 252거래일(1년) 확보용 — 400 캘린더일 ≈ 276 거래일
  const period1 = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const results = await mapLimit(ALL_SYMS, 12, async (sym): Promise<PerfRow | null> => {
```
→
```ts
export async function computeCnPerf(): Promise<{ ok: true; computed: number; attempted: number; slice: string; at: string }> {
  // 약 280 달력일 룩백 — 6개월(126 거래일) + 비거래일 버퍼 충분
  const LOOKBACK_DAYS = 400; // 252거래일(1년) 확보용 — 400 캘린더일 ≈ 276 거래일
  const period1 = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  // ── STEP 750: 하루 1방(7,098·300초 초과 상습) → 3시간 8분할 슬라이스 ──
  // 파티션 = 실행 시각 기반 결정론(상태 저장 없음). 크론이 늦게 떠도(Vercel 지연) 가장 가까운 슬롯으로 스냅.
  // 하루 8회 × ~890종목 = 전 유니버스 일일 커버. 부분 실패는 그 슬라이스만 다음날 재시도.
  const SLOTS = 8; // vercel.json: 0,3,6,9,12,15,18,21시(UTC)
  const slot = Math.round(new Date().getUTCHours() / 3) % SLOTS;
  const target = ALL_SYMS.filter((_, i) => i % SLOTS === slot);

  // 시간 예산 — 소스가 hang이어도 함수 전체가 죽지 않게. 예산 소진 시 새 심볼을 집지 않고 걷은 것만 저장.
  const startedAt = Date.now();
  const TIME_BUDGET_MS = 220_000; // maxDuration 300초 대비 upsert 여유
  const budgetLeft = () => Date.now() - startedAt < TIME_BUDGET_MS;

  const results = await mapLimit(target, 12, async (sym): Promise<PerfRow | null> => {
    if (!budgetLeft()) return null; // 예산 소진 — 스킵(다음 슬롯/다음날 재시도)
```
(함수 본문의 나머지 `try { … } catch { return null; }`는 그대로 — `mapLimit(ALL_SYMS,` 가 `mapLimit(target,` 으로 바뀌고 첫 줄에 예산 가드만 추가되는 것.)

리턴문:
```ts
  return { ok: true, computed: payload.length, at };
```
→
```ts
  return { ok: true, computed: payload.length, attempted: target.length, slice: `${slot + 1}/${SLOTS}`, at };
```

## 수정 2 — `vercel.json`

`cn-perf` 크론 스케줄:
```json
{ "path": "/api/cron/cn-perf", "schedule": "0 8 * * *" }
```
→
```json
{ "path": "/api/cron/cn-perf", "schedule": "0 */3 * * *" }
```
(다른 크론 11개 + STEP 749 `health` 불변.)

---

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` 통과 · `npm run build` 성공
2. push → 배포 후 **수동 실행**:
   ```bash
   cd ~/stock-terminal && set -a && source .env.local && set +a && time curl -s -m 290 -H "Authorization: Bearer $CRON_SECRET" https://onetrillion.app/api/cron/cn-perf
   ```
   기대: **300초 안에 JSON 반환**(`ok:true · attempted ~887 · slice "N/8" · computed > 0`). computed가 attempted보다 크게 작으면(예: A주 전멸) 그 수치 그대로 보고 — Vercel IP 차단 여부의 증거가 됨(HK만 성공 = 차단, 골고루 성공 = 지연이었음).
3. 보고 후 Cowork이 DB로 `cn_stock_perf` max(updated_at) 전진 + 커버리지 확인.

## 커밋

```bash
git add lib/cnPerf.ts vercel.json docs/STEP_750_COMMAND.md
git commit -m "STEP 750: fix cn-perf chronic timeout - 8-way time-sliced cron with time budget"
git push
```

## 완료 보고 → Cowork에게
- tsc/build + 수동 실행 JSON 전문(attempted/computed/slice) + 소요 시간 + 커밋 해시.
