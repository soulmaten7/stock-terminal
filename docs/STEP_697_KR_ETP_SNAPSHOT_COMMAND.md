<!-- 2026-07-11 -->
# STEP 697 — ⚡ ETF/ETN 성과 크론 스냅샷화(kr_etp_snapshot) — 커밋 + 크론 1회 트리거 + 라이브확인

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** 코드는 **Cowork(Opus)가 작성·`tsc --noEmit`=0.** `kr_etp_snapshot` **테이블은 Cowork이 Supabase에 이미 생성**(마이그레이션 파일은 기록용). vitest는 Cowork 샌드박스 arch 이슈로 못 돌림 → 맥/CI가 게이트. 이 STEP = 임시파일 정리 + 맥 test·build + 커밋/푸시 + **크론 1회 수동 트리거(테이블 채우기)** + 라이브확인.

**배경(한국탭 완성 STEP②):** ETF/ETN 성과가 매 요청 **라이브 fetch(최대 36콜)**라 동시요청 throttle로 **r1w·r3m이 전 종목 빈칸**(라이브 확인함: source 데이터는 있는데 join 실패)·콜드 2.8s. → **종목보드(kr_stock_snapshot)와 동일하게 매일 크론 스냅샷**으로. 검증된 순수함수 `pct` 재사용, **순차 fetch로 throttle 회피**.

**바뀐 것(Cowork이 이미 작성·tsc=0):**
- `supabase/migrations/20260711_kr_etp_snapshot.sql` (신규·**테이블 이미 적용됨**, 기록용)
- `lib/krEtpSnapshot.ts` (신규) — ETF+ETN 전종목 base+5기간(1주~1년) 순차 스냅샷 → `pct`로 수익률 → upsert.
- `app/api/cron/kr-etp/route.ts` (신규) — 크론 엔드포인트(CRON_SECRET 인증, kr-perf와 동일 패턴).
- `app/api/krx/etf-performance/route.ts`·`etn-performance/route.ts` — **스냅샷 우선 SELECT**(kind=etf/etn, 거래대금순 100). 스냅샷 비면 기존 **라이브 폴백 유지**. `?debug=1`은 라이브 진단 그대로.
- `vercel.json` — `kr-etp` 크론 `15 10 * * *`(10:15 UTC, kr-perf 직후).

---

## 1. 임시파일 정리 + 로컬(맥) 검증
```bash
rm -f _probe_tmp.mjs _probe_lens.ts   # Cowork 샌드박스가 남긴 임시 프로브 제거
npm install
npm test                               # ✅ 7 passed(변동 없음)
npx tsc --noEmit                       # 0
npm run build 2>&1 | tail -6           # 빌드 성공
```

## 2. CHANGELOG (오늘 블록)
```
- **697**: ⚡ ETF/ETN 성과 **크론 스냅샷화**(kr_etp_snapshot) — 매 요청 라이브 fetch(36콜)의 부분실패(r1w/r3m 전 종목 빈칸)·콜드 2.8s 해소. 종목보드와 동일 패턴·검증된 pct 재사용·순차 fetch. 라우트는 스냅샷 우선(빈 값이면 라이브 폴백). 크론 10:15 UTC.
```

## 3. 커밋 → 푸시
```bash
git add supabase/migrations/20260711_kr_etp_snapshot.sql lib/krEtpSnapshot.ts app/api/cron/kr-etp/route.ts "app/api/krx/etf-performance/route.ts" "app/api/krx/etn-performance/route.ts" vercel.json docs/CHANGELOG.md docs/STEP_697_KR_ETP_SNAPSHOT_COMMAND.md
git commit -m "feat(kr): ETF/ETN 성과 크론 스냅샷화(kr_etp_snapshot) — 라이브 fetch 부분실패·느림 해소"
git push
```

## 4. CI 초록불 (Actions 탭) — tsc·test 통과.

## 5. 배포 후 크론 1회 수동 트리거 (테이블 즉시 채우기 — 10:15 안 기다림)
```bash
SECRET=$(grep -E '^CRON_SECRET=' .env.local | cut -d= -f2- | tr -d '"')
curl -s -H "Authorization: Bearer $SECRET" "https://onetrillion.app/api/cron/kr-etp"; echo
```
- 응답 `{"ok":true,"etf":N,"etn":M}` (N·M>0) 기대. KRX 순차 fetch라 **수십 초** 걸릴 수 있음(정상).

## 6. 라이브 확인 ★ 진짜 게이트
```bash
for k in etf etn; do echo "== $k =="; curl -s "https://onetrillion.app/api/krx/$k-performance" | python3 -c "import sys,json;d=json.load(sys.stdin);it=d.get('items',[]);n=sum(1 for x in it if x.get('r1w') is not None);m=sum(1 for x in it if x.get('r3m') is not None);print('source',d.get('source'),'| items',len(it),'| r1w채움',n,'| r3m채움',m)"; done
```
- `source=kr_etp_snapshot` + **r1w·r3m 채움 수가 대부분**(예 90+/100)이면 성공. (예전엔 0.)

## Cowork에게 보고
- 크론 트리거 `ok:true`(etf·etn 개수) + 두 라우트 `source=kr_etp_snapshot`·r1w/r3m 채움 수.
