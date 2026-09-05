<!-- 2026-07-01 -->
# STEP 490 — 수익률(1주~6개월) 전종목 조인 (US·JP perf 조인 1,000행 제한 수정)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_490_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표 (2파일: `us-list` · `jp-list` route)
US·JP 종목표의 **1주~6개월 수익률이 전 종목**에 뜨게. 현재 perf 테이블엔 데이터 다 있는데(jp 3,092·us 6,092행) 조인이 `.select()` 기본 제한(~1,000행)에 걸려 일부만 채워짐 → **1,000개씩 페이지네이션으로 전량 조회**.
- 현재가·1일·1년은 이미 전 종목 라이브(야후)라 영향 없음. 이 STEP은 1주~6개월만.
- ⚠️ API 라우트 → 클린 재시작.

---

## 1) `app/api/yahoo/us-list/route.ts`
**찾을 것:**
```ts
    const sb = createAdminClient();
    const { data: perf } = await sb.from("us_stock_perf").select("symbol,r1w,r1m,r3m,r6m");
    if (perf && perf.length > 0) {
```
**바꿀 것:**
```ts
    const sb = createAdminClient();
    type P = { symbol: string; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null };
    const perf: P[] = [];
    for (let from = 0; from < 20000; from += 1000) {
      const { data } = await sb.from("us_stock_perf").select("symbol,r1w,r1m,r3m,r6m").range(from, from + 999);
      if (!data || data.length === 0) break;
      perf.push(...(data as P[]));
      if (data.length < 1000) break;
    }
    if (perf.length > 0) {
```

## 2) `app/api/yahoo/jp-list/route.ts`
**찾을 것:**
```ts
    const sb = createAdminClient();
    const { data: perf } = await sb.from("jp_stock_perf").select("symbol,r1w,r1m,r3m,r6m");
    if (perf && perf.length > 0) {
```
**바꿀 것:**
```ts
    const sb = createAdminClient();
    type P = { symbol: string; r1w: number | null; r1m: number | null; r3m: number | null; r6m: number | null };
    const perf: P[] = [];
    for (let from = 0; from < 20000; from += 1000) {
      const { data } = await sb.from("jp_stock_perf").select("symbol,r1w,r1m,r3m,r6m").range(from, from + 999);
      if (!data || data.length === 0) break;
      perf.push(...(data as P[]));
      if (data.length < 1000) break;
    }
    if (perf.length > 0) {
```

> 두 파일 모두 이어지는 `for (const p of perf ...)` 루프는 그대로 둔다(perf가 이제 전량).

---

## 3) 빌드 + 클린 재시작
```bash
npm run build
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 4) 검증 (localhost:3333)
```bash
# JP 주식 중 1주 수익률 채워진 개수 — 대폭 늘어야 함(622 → 수천)
curl -s "http://localhost:3333/api/yahoo/jp-list?type=stock" | python3 -c "import sys,json; d=json.load(sys.stdin)['items']; print('total',len(d),'r1w_filled',sum(1 for x in d if x.get('r1w') is not None))"
# US도
curl -s "http://localhost:3333/api/yahoo/us-list" | python3 -c "import sys,json; d=json.load(sys.stdin)['items']; print('total',len(d),'r1w_filled',sum(1 for x in d if x.get('r1w') is not None))"
```
- [ ] JP: `r1w_filled`가 3,000 근처(야후 데이터 있는 전 종목)로 증가.
- [ ] US: `r1w_filled`가 6,000 근처로 증가.
- [ ] 🇯🇵/🇺🇸 종목 행 클릭 → 1주~1년 수익률 패노라마가 대부분 "—" 아니고 값 표시.

## 5) 커밋
```bash
git add app/api/yahoo/us-list/route.ts app/api/yahoo/jp-list/route.ts && git commit -m "fix: 종목표 1주~6개월 수익률 전종목 조인 — perf 조인 페이지네이션(1,000행 제한 해소, US·JP) (STEP 490)" && git push
```

## ⚠️ 노트
- 현재가·1일·1년은 원래 전 종목 야후 라이브라 이 STEP과 무관(이미 정상).
- KR은 스냅샷 직접 서빙(limit 명시)이라 해당 없음.
