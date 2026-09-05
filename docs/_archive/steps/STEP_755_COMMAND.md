# STEP 755 — US 유니버스 일일화(KR 동급 편입) + us/vn/gb Perf 하드닝 미러

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet — 워크플로 1줄 + 3파일 미러)

**전제 상태**: 코드 HEAD `c9b1ab0`(STEP 754b) · 트리 클린

**배경(3중 검증 완료 · 2026-07-18)**:
- 월 1회는 Cowork의 보수적 선택이었을 뿐 제약 아님. 검증: ① GitHub Actions — 스케줄은 5~30분 지연 상시(무관)·**60일 무커밋 시 스케줄 워크플로 조용히 자동 비활성**(일일 diff 커밋이 타이머 리셋하므로 실질 무해·주석 명시) ② Vercel Hobby 공식 = **하루 100 배포** 한도(일일 자동배포 +1 무해·월 빌드분 한도 없음) ③ 나스닥 디렉토리 = nightly 갱신 → 09:00 UTC 실행 안전.
- 하드닝: jp(753)·cn(750b·752)에서 검증된 패턴을 us/vn/gb에 미러 — **US가 JP가 당한 장애 클래스(무타임아웃 야후 콜 hang → 300초 → 그날 스킵)에 노출된 마지막 큰 파이프라인.**

**효과**: 신규 상장 익일 편입(KR 동급 주기) + 6개국 Perf 전부 hang-내성 → KR·US 견고성/주기 격차 종결.

---

## 수정 1 — `.github/workflows/refresh-us-symbols.yml` (월간→일일)

```yaml
  schedule:
    - cron: "0 2 1 * *" # 매월 1일 02:00 UTC
```
→
```yaml
  schedule:
    # 매일 09:00 UTC(새벽 4~5시 ET) — 나스닥 디렉토리 nightly 갱신 후·개장 전.
    # 변경 없으면 no-op(커밋 안 함) → 비용≈0. 같은 날 22:00 UTC us-perf가 신규 종목 시세 채움 = 익일 보드 편입(KR 동급).
    # ⚠️ GitHub는 60일 무커밋 리포의 스케줄 워크플로를 조용히 비활성화함 — 일일 diff 커밋이 타이머를 리셋하므로
    #    실질 무해하나, 장기 개발 중단 시 Actions 탭에서 워크플로 활성 상태 확인할 것.
    - cron: "0 9 * * *"
```
(commit 스텝의 메시지 "monthly US universe refresh" → "daily US universe refresh"로 함께 수정.)

## 수정 2 — `lib/usPerf.ts` · `lib/vnPerf.ts` · `lib/gbPerf.ts` 하드닝 (STEP 753 jpPerf 미러)

세 파일 각각에 **lib/jpPerf.ts(753)와 동일한 구조**를 적용한다 — jpPerf를 열어 패턴을 그대로 미러:

1. `withTimeout` 헬퍼 추가(jpPerf의 것과 동일 구현·주석 포함)
2. `yf.chart(...)` 호출을 `withTimeout(yf.chart(...), 5000)`으로 wrap
3. compute 함수에 시간 예산 + 신선도 역순:
   - `const sb = createAdminClient();`를 함수 상단으로 이동(하단 중복 제거)
   - 해당 perf 테이블(`us_stock_perf`/`vn_stock_perf`/`gb_stock_perf`)에서 `(symbol, updated_at)`을 `.range` 페이지네이션으로 읽어 `seen` 맵 구성
   - `target = [...대상심볼].sort(오래된 것 먼저 · 미수록=0=최우선)` — usPerf는 기존 `STOCK_SYMS`(type==='stock' 필터) 유지한 채 정렬만 추가
   - `TIME_BUDGET_MS = 260_000` · mapLimit fn 첫 줄 `if (!budgetLeft()) return null;`
   - 리턴에 `attempted: target.length` 포함
4. 각 파일의 기존 로직(ret·mapLimit·upsert 500단위·onConflict)은 불변

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. 커밋·푸시:
   ```bash
   git add .github/workflows/refresh-us-symbols.yml lib/usPerf.ts lib/vnPerf.ts lib/gbPerf.ts docs/STEP_755_COMMAND.md
   git commit -m "STEP 755: daily US universe refresh (KR-parity listing cadence) + harden us/vn/gb perf like jp/cn"
   git push
   ```
3. 배포 반영 확인(라이브 sentry-release = 이 커밋) 후 **수동 실행 3종**:
   ```bash
   set -a && source .env.local && set +a
   time curl -s -m 290 -H "Authorization: Bearer $CRON_SECRET" https://onetrillion.app/api/cron/us-perf
   time curl -s -m 120 -H "Authorization: Bearer $CRON_SECRET" https://onetrillion.app/api/cron/vn-perf
   time curl -s -m 120 -H "Authorization: Bearer $CRON_SECRET" https://onetrillion.app/api/cron/gb-perf
   ```
   기대: us `ok:true·attempted 5,964·computed 5,8xx~`(신규 편입분 포함·300초 내) · vn/gb 수십 초 완주.
4. GitHub Actions 탭에서 `refresh-us-symbols` workflow_dispatch 1회 → "no changes" 또는 소량 diff 커밋 확인.

## 완료 보고 → Cowork에게
- 3종 JSON(attempted/computed)+소요 시간 · Actions 결과 · 커밋 해시. (Cowork이 DB 신선도 재확인 + 문서 마감.)
