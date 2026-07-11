<!-- 2026-07-09 -->
# STEP 668 — ⚡ 5개 보드 가격 스냅샷화 (라이브 야후 제거 → KR처럼 즉시)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** HEAD = STEP 667 이후.
**목표:** VN·US·CN·JP·GB 종목 보드가 요청 시 **야후 라이브 `yf.quote`로 전체 유니버스**를 긁어 느린 걸, **크론이 미리 저장한 스냅샷을 테이블에서 서빙**하도록(=KR `kr_stock_snapshot` 방식). 로딩 즉시화.
**KR은 이미 `krSnapshot`이라 손대지 않음.** 대상 5개: `vn·us·cn·jp·gb`.

> **원인**: `{cc}Perf.ts` 크론은 수익률만 저장하고, 보드는 가격을 라이브로 긁음. 근데 크론이 이미 `yf.chart`로 종가 배열을 받으니 **맨 끝 종가=현재가·거래량·1년수익률이 손에 있음** → 저장만 하면 됨.
> **트레이드오프**: 보드 가격이 크론 시점(≈하루) 기준. **KR이 이미 그럼**(실시간은 종목 페이지). 일관성 OK.

---

## 1. 마이그레이션 — 5개 perf 테이블에 컬럼 추가
`supabase/migrations/`에 새 파일(다음 번호) 생성 + 적용:
```sql
-- {cc}_stock_perf에 스냅샷 필드 추가(가격·거래대금·1년수익률). 이미 있으면 무시.
alter table vn_stock_perf add column if not exists price numeric, add column if not exists amount numeric, add column if not exists r1y numeric;
alter table us_stock_perf add column if not exists price numeric, add column if not exists amount numeric, add column if not exists r1y numeric;
alter table cn_stock_perf add column if not exists price numeric, add column if not exists amount numeric, add column if not exists r1y numeric;
alter table jp_stock_perf add column if not exists price numeric, add column if not exists amount numeric, add column if not exists r1y numeric;
alter table gb_stock_perf add column if not exists price numeric, add column if not exists amount numeric, add column if not exists r1y numeric;
```
> 각 테이블에 `r1d,r1w,r1m,r3m,r6m,symbol,updated_at`은 이미 있음. `price·amount·r1y`만 추가. (컬럼명이 다르면 실제 스키마 확인 후 맞춤.)

## 2. `lib/{cc}Perf.ts` — 스냅샷 저장(종가·거래량·1년) · VN이 템플릿
`lib/vnPerf.ts` 기준 변경(나머지 4개 동일 패턴):
- `PerfRow` 타입에 `price·amount·r1y` 추가.
- `yf.chart` 결과에서 **거래량도 읽기**: `quotes.map((q)=>({close:q.close, volume:q.volume}))`.
- 종가 배열(closes)의 마지막 = 현재가. 마지막 거래량 = vol. `amount = price*vol`. `r1y = ret(closes, 252)`(280일 차트라 커버).
```ts
type PerfRow = { symbol: string; r1d: number|null; r1w: number|null; r1m: number|null; r3m: number|null; r6m: number|null; price: number|null; amount: number|null; r1y: number|null };
// ...
const bars = (ch.quotes ?? []) as Array<{ close: number|null; volume: number|null }>;
const closes = bars.map(b=>b.close).filter((c): c is number => typeof c==="number" && isFinite(c) && c>0);
if (closes.length < 6) return null;
const price = closes[closes.length-1];
const lastVol = bars[bars.length-1]?.volume ?? null;
return {
  symbol: sym,
  r1d: ret(closes,1), r1w: ret(closes,5), r1m: ret(closes,21), r3m: ret(closes,63), r6m: ret(closes,126),
  r1y: ret(closes,252),
  price,
  amount: (lastVol && price) ? price*lastVol : null,
};
```
- upsert payload에 새 필드 포함(onConflict "symbol" 그대로).
- **US/CN/JP/GB의 Perf 파일도 같은 편집**(각자 symbols 유니버스·period1은 그대로, price·amount·r1y 저장만 추가). CN은 A주/HK 섞여도 chart 방식 동일.

## 3. `/api/yahoo/{cc}-list` — 테이블 서빙(라이브 야후 제거)
`vn-list` 기준, **`yf.quote` 유니버스 페치 블록 삭제** → `{cc}_stock_perf` 전체 SELECT해서 Item 구성:
```ts
export async function GET() {
  if (cache && Date.now()-cache.at < 15*60*1000) return NextResponse.json(cache.data);
  const sb = createAdminClient();
  const rows: Item[] = [];
  for (let from=0; from<30000; from+=1000) {
    const { data } = await sb.from("vn_stock_perf")
      .select("symbol,price,r1d,r1w,r1m,r3m,r6m,r1y,amount").range(from, from+999);
    if (!data || data.length===0) break;
    for (const p of data as Array<Record<string,number|null>>) {
      const price = p.price ?? 0;
      if (!(price>0)) continue;
      rows.push({
        symbol: String(p.symbol),
        name: NAME_MAP.get(String(p.symbol)) || String(p.symbol),
        price,
        changePercent: (p.r1d as number) ?? 0,
        r1w: p.r1w ?? null, r1m: p.r1m ?? null, r3m: p.r3m ?? null, r6m: p.r6m ?? null,
        r1y: p.r1y ?? null,
        amount: p.amount ?? 0,
      });
    }
    if ((data as unknown[]).length < 1000) break;
  }
  const items = rows.sort((a,b)=> (b.amount ?? 0) - (a.amount ?? 0));
  const data = { items };
  cache = { at: Date.now(), data };
  return NextResponse.json(data);
}
```
- **`yf`(YahooFinance) import·인스턴스가 이 파일에서 더 안 쓰이면 제거.** `chunk`/`mapLimit`도 미사용이면 정리.
- `Item` 타입에 `r1y` 있는지 확인(없으면 추가). 클라(`{cc}MarketBoard`)가 `r1y` 이미 씀.
- **US 라우트는 구조가 조금 다를 수 있음**(ETF 분리 등) — 가격 소스만 테이블로 바꾸고 나머지 US 특이 로직 유지. CN/JP/GB는 VN과 거의 동일.

## 4. 스냅샷 채우기 — 크론 1회 수동 트리거
컬럼 추가 직후엔 price가 비어 있으니, 각 크론을 1회 실행해 채운다(로컬=prod와 같은 Supabase):
```bash
# .env.local의 CRON_SECRET 사용. 로컬 dev 서버 켠 상태에서:
for cc in vn us cn jp gb; do
  echo "== $cc =="; curl -s -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3333/api/cron/$cc-perf" | head -c 200; echo;
done
```
> `$CRON_SECRET`이 셸에 없으면 `.env.local`에서 export. 각 응답 `{ok:true, computed:N}` 확인. (시간 좀 걸림 — maxDuration 300.)

## 5. 검증(3회 정신) → 커밋
```bash
npx tsc --noEmit          # EXIT 0
```
- **속도**: `time curl -s "http://localhost:3333/api/yahoo/vn-list" > /dev/null` — 라이브 때(수 초) 대비 **테이블 서빙(수백 ms)** 확인. 5개 다.
- **데이터 정합(1차)**: `curl .../vn-list | python3 -c "import sys,json; d=json.load(sys.stdin)['items']; print(len(d), d[0])"` — 항목 수·상위 종목 price·수익률·amount 정상(0/누락 아님).
- 종목 페이지·미리보기 회귀 없음(가격·수익률 표시). console.log 금지.
```bash
git add supabase/migrations/ lib/vnPerf.ts lib/usPerf.ts lib/cnPerf.ts lib/jpPerf.ts lib/gbPerf.ts app/api/yahoo/vn-list/route.ts app/api/yahoo/us-list/route.ts app/api/yahoo/cn-list/route.ts app/api/yahoo/jp-list/route.ts app/api/yahoo/gb-list/route.ts
git commit -m "perf(boards): VN·US·CN·JP·GB 가격 스냅샷화 — 크론이 종가·거래량·1년 저장, list가 테이블 서빙(라이브 야후 제거, KR 미러)"
git push
```
- 배포 후: 6개국 탭 로딩 **즉시** 체감(콜드 스타트 포함). 첫 배포 후 크론이 아직 안 돌았으면 prod 크론 수동 트리거 or 스케줄(08/22 UTC) 대기.

## Cowork에게 보고
1. 5개 list 속도(전/후 ms) + 항목 수.
2. 크론 트리거 결과(computed 수) — 유니버스 대비 누락률.
3. 회귀(종목 페이지 가격·수익률) 정상 여부.
→ 다음 = **데이터 정확성 3회 검수**(유니버스·네이티브명·통화·정렬·지수·매매처) — Cowork이 라운드 설계.
