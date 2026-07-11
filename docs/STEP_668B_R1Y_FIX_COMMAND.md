<!-- 2026-07-09 -->
# STEP 668B — 🔧 r1y(1년 수익률) 회귀 수정 — 크론 룩백 확장

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** STEP 668 커밋(`a88c0e3`) 이후. 5개 보드 스냅샷 서빙 중이나 **r1y가 전부 null.**
**목표:** `{cc}Perf.ts`의 차트 룩백이 **280일(≈193거래일)이라 252거래일 미달 → `ret(closes,252)` null**. 룩백을 **400일**로 늘려 252거래일 확보 → r1y 정상 계산. (그 외 로직 그대로.)
**대상:** `lib/vnPerf.ts · usPerf.ts · cnPerf.ts · jpPerf.ts · gbPerf.ts` (5개).

> 왜: STEP 668에서 라이브 quote(52주 변화)를 제거하며 r1y를 크론 차트로 계산하게 했는데, 룩백이 짧아 1년치 데이터가 안 잡힘. 보드 "1년전" 컬럼·미리보기 "1년"이 비어 있음.

---

## 변경 (5개 파일 동일)
각 `lib/{cc}Perf.ts`의 룩백 상수:
```ts
const period1 = new Date(Date.now() - 280 * 24 * 60 * 60 * 1000);
```
→
```ts
const period1 = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);   // 252거래일(1년) 확보용
```
> 400 캘린더일 ≈ 276 거래일 > 253 → `ret(closes, 252)` 계산됨. (CN이 Eastmoney 등 다른 소스를 쓰면 그쪽 룩백/기간도 1년 이상인지 확인 — HK/야후 chart는 이 상수.)

## 크론 재트리거 (r1y 채우기)
```bash
export CRON_SECRET=$(grep -E '^CRON_SECRET=' ~/stock-terminal/.env.local | cut -d= -f2- | tr -d '"')
# 로컬에서 5개 재실행 — 단, 앞 크론들 누적 시 Yahoo 로컬 rate-limit 가능 → 하나씩·간격 두고
for cc in vn gb jp cn; do echo "== $cc =="; curl -s -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3333/api/cron/$cc-perf" | head -c 120; echo; sleep 5; done
```
> **US는 로컬 rate-limit 전례** → US만 prod로: `curl -s -H "Authorization: Bearer $CRON_SECRET" "https://onetrillion.app/api/cron/us-perf" | head -c 120` (배포 후). 로컬이 rate-limit 걸리면 나머지도 prod로 트리거하거나 스케줄(08/22 UTC) 대기.

## 검증 → 커밋
```bash
npx tsc --noEmit          # EXIT 0
```
- 확인: `curl -s ".../api/yahoo/vn-list" | python3 -c "import sys,json; d=json.load(sys.stdin)['items']; print('r1y 있는 종목:', sum(1 for x in d if x.get('r1y') is not None), '/', len(d))"` — **r1y 있는 종목이 대다수**면 성공(상장 1년 안 된 종목만 null 정상).
- 5개 보드 "1년전" 컬럼·미리보기 "1년"에 값 뜨는지.
```bash
git add lib/vnPerf.ts lib/usPerf.ts lib/cnPerf.ts lib/jpPerf.ts lib/gbPerf.ts
git commit -m "fix(perf): {cc}Perf 차트 룩백 280→400일 — r1y(1년 수익률) 계산 복구(252거래일 확보)"
git push
```
- 배포 후 prod 크론(특히 us-perf) 1회 재트리거 → prod r1y 채움.

## Cowork에게 보고
- 5개 보드 r1y 채워짐 비율(대다수여야 정상).
→ 이걸로 성능+데이터 손실 마무리. 다음 = **데이터 정확성 3회 검수**.
