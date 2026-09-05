<!-- 2026-07-09 -->
# STEP 672 — 🇻🇳 VN 가격 소스 야후→VCI 이전 (HOSE+HNX 완전판)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** STEP 671 게이트 FAIL(야후=HOSE 전용). VCI(Vietcap)가 HNX 커버 확인됨(SHS/PVS/CEO OK).
**목표:** VN 종목 가격·수익률 소스를 **야후 `.VN` → VCI**로 이전 → **HOSE(403·완전판)+HNX(299)=702 주식** 커버. HOSE 서브셋(387)도 해소.
**대상:** `data/vn_symbols.json`(교체) · `lib/vnPerf.ts`(재작성) · `lib/vnPerf.ts` 주석. `vn-list`는 이미 테이블 서빙(STEP 668)이라 변경 없음.
**준비됨:** `data/_vn_new_symbols.json` = HOSE403+HNX299=702(Cowork가 vnstock으로 생성·`{sym:'XXX.VN', name:베트남어, market:'hose'|'hnx'}`).

> 검증된 VCI 요청: `POST https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart` · body `{timeFrame:"ONE_DAY", symbols:["SHS"], to:<unixSec>, countBack:N}`(심볼 **.VN 없이**) · 응답 `[{o,h,l,c,v,t 배열}]`.

---

## 🔴 0단계 — VCI Vercel 도달성 게이트 (배포 전 로컬, 배포 후 prod)
东方財富(CN) IP차단 전례 → VCI가 데이터센터 IP를 막는지 확인.
```bash
node --input-type=module -e '
const url="https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart";
const to=Math.floor(Date.now()/1000);
const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json","User-Agent":"Mozilla/5.0","Referer":"https://trading.vietcap.com.vn/"},body:JSON.stringify({timeFrame:"ONE_DAY",symbols:["SHS"],to,countBack:10})});
const j=await r.json(); console.log("status",r.status); console.log(JSON.stringify(j).slice(0,300));
'
```
- **200 + OHLC 배열** → 진행. **차단/빈값** → 헤더 조정(Origin 추가) 재시도 → 그래도 막히면 Cowork 보고(대안 논의).

## 1단계 — vn_symbols.json 교체 + 스케일 확인
```bash
python3 -c "
import json
new=json.load(open('data/_vn_new_symbols.json'))
json.dump(new, open('data/vn_symbols.json','w'), ensure_ascii=False)
from collections import Counter
print('교체', len(new), Counter(x['market'] for x in new))
"
rm -f data/_vn_new_symbols.json
```
> **가격 스케일 주의**: VCI 종가는 **천 단위**(SHS 19.4 = 19,400 VND). 보드가 VND 정수를 기대하면 **×1000** 필요. 1단계 후 FPT 등으로 실측(FPT 실제 ≈ 130,000 VND면 VCI 130 → ×1000).

## 2단계 — `lib/vnPerf.ts` 재작성 (yf.chart → VCI)
`computeVnPerf`의 심볼별 fetch를 VCI로 교체. 나머지(ret·mapLimit·upsert·price/amount/r1y 저장=STEP 668/668B)는 유지.
```ts
const VCI_URL = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart";
const VCI_HEADERS = { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0", Referer: "https://trading.vietcap.com.vn/" };
const PRICE_SCALE = 1000; // VCI 천단위 → VND (0단계/1단계 실측으로 확정)

async function vciChart(ticker: string): Promise<{ closes: number[]; lastVol: number } | null> {
  const to = Math.floor(Date.now() / 1000);
  const res = await fetch(VCI_URL, {
    method: "POST", headers: VCI_HEADERS,
    body: JSON.stringify({ timeFrame: "ONE_DAY", symbols: [ticker], to, countBack: 300 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const j = await res.json();
  const d = Array.isArray(j) ? j[0] : (j?.data?.[0] ?? null);
  if (!d || !Array.isArray(d.c) || d.c.length < 6) return null;
  const closes = (d.c as number[]).map((c) => c * PRICE_SCALE).filter((c) => c > 0);
  const v = Array.isArray(d.v) ? d.v : [];
  return { closes, lastVol: v.length ? Number(v[v.length - 1]) : 0 };
}
```
- `STOCK_SYMS`는 `.VN` 붙은 심볼 → VCI엔 **`.VN` 제거**(`sym.replace(/\.VN$/i,"")`)해서 넘김. 결과 저장은 원래 `.VN` 심볼로.
- 각 심볼: `vciChart(ticker)` → `closes`로 `ret(closes, 1/5/21/63/126/252)`·`price=closes[last]`·`amount=price*lastVol`.
- 동시성(mapLimit) 12 유지하되 VCI 부하 보며 8~12. (⚡ 선택: VCI `symbols` 배열이 배치 지원하면 20~50개씩 묶어 호출 = 대폭 가속. 배치 응답이 심볼별 객체 배열인지 먼저 1회 테스트 후 적용.)

## 3단계 — 배포 → prod 크론 재실행 → 검증
```bash
npx tsc --noEmit
# 커밋·push (배포)
git add data/vn_symbols.json lib/vnPerf.ts
git commit -m "feat(vn): 가격 소스 야후→VCI 이전 — HOSE+HNX 702주식 커버(HNX/HOSE서브셋 해소), 천단위×1000"
git push
# 배포 후 prod 크론
export CRON_SECRET=$(grep -E '^CRON_SECRET=' ~/stock-terminal/.env.local | cut -d= -f2- | tr -d '"')
curl -s -H "Authorization: Bearer $CRON_SECRET" "https://onetrillion.app/api/cron/vn-perf" | head -c 150; echo
# 검증
curl -s "https://onetrillion.app/api/yahoo/vn-list" | python3 -c "import sys,json;d=json.load(sys.stdin)['items'];print('VN 총',len(d),'| 상위3',[(x['symbol'],x['name'],x['price']) for x in d[:3]])"
```
- **VN 총이 HOSE+HNX 합(≈700 중 가격 붙은 것)** + HNX 종목(SHS.VN 등) 포함 + **가격 스케일 정상**(FPT ≈13만) + 베트남어명 + 거래대금순.
- 종목 페이지·미리보기 회귀 없음(가격·수익률). console.log 금지.

## Cowork에게 보고
1. **0단계 VCI 도달성**(로컬·**Vercel prod** 둘 다) — 가장 중요.
2. VN 총 종목·HNX 포함 여부·**가격 스케일**(×1000 맞는지).
3. 크론 소요시간(배치 적용했으면 속도).
→ 남은 완전성: **#2 CN A주 ~1,600 확장**(같은 VCI식으로 소스 있나) + UPCOM(원하면 토글). 그 후 Round 2(Chrome 라이브)·Round 3(교차).
