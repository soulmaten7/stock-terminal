<!-- 2026-07-09 -->
# STEP 672C — 🇻🇳 VN off-Vercel 크론 (GitHub Actions + VCI) · HOSE+HNX 702

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** 672B 프로브 성공 — GitHub Actions(Azure IP)에서 VCI 통과 확인. 원시 VCI = **풀 VND**(×1000 불필요).
**목표:** VN 종목 perf(HOSE+HNX 702)를 **GitHub Actions 스케줄 크론**이 VCI로 계산 → `vn_stock_perf` upsert. (Vercel은 VCI 차단이라 여기서 못 함.) → HNX·HOSE 완전판 살아남 + **IP차단 소스용 재사용 인프라 확립.**
**대상:** `data/vn_symbols.json`(702 교체) · `scripts/vn_perf_cron.mjs`(신규) · `.github/workflows/vn_perf.yml`(신규) · `vercel.json`(vn-perf 제거) · 임시 `vci_probe.yml` 삭제.
**준비됨:** `data/_vn_new_symbols.json` = 702.

---

## 1. vn_symbols.json 교체 (702)
```bash
python3 -c "import json;json.dump(json.load(open('data/_vn_new_symbols.json')),open('data/vn_symbols.json','w'),ensure_ascii=False)"
rm -f data/_vn_new_symbols.json
```

## 2. `scripts/vn_perf_cron.mjs` (VCI → Supabase, 독립 ESM)
```js
// VN perf 계산: VCI gap-chart(배치) → r1d..r1y·price·amount → vn_stock_perf upsert.
// GitHub Actions에서 실행(Vercel은 VCI IP차단). node scripts/vn_perf_cron.mjs
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SB_KEY) { console.error("Supabase env 없음"); process.exit(1); }
const sb = createClient(SB_URL, SB_KEY);

const VCI = "https://trading.vietcap.com.vn/api/chart/OHLCChart/gap-chart";
const H = { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0", Referer: "https://trading.vietcap.com.vn/" };

const syms = JSON.parse(fs.readFileSync("data/vn_symbols.json", "utf8")).map((s) => s.sym); // 'XXX.VN'
const ret = (c, n) => (c.length > n && c[c.length-1-n] > 0) ? (c[c.length-1]/c[c.length-1-n]-1)*100 : null;

function chunk(a, n) { const o=[]; for (let i=0;i<a.length;i+=n) o.push(a.slice(i,i+n)); return o; }

async function fetchBatch(tickers) { // tickers = ['SHS', ...] (.VN 제거됨)
  const to = Math.floor(Date.now()/1000);
  const r = await fetch(VCI, { method:"POST", headers:H,
    body: JSON.stringify({ timeFrame:"ONE_DAY", symbols: tickers, to, countBack: 300 }) });
  if (!r.ok) return [];
  const j = await r.json();
  return Array.isArray(j) ? j : (j?.data ?? []);
}

const rows = [];
const at = new Date().toISOString();
for (const grp of chunk(syms, 40)) {                     // 배치 40개씩
  const tickers = grp.map((s) => s.replace(/\.VN$/i, ""));
  let data = [];
  try { data = await fetchBatch(tickers); } catch { data = []; }
  const byT = new Map(data.map((d) => [d.symbol, d]));
  for (const s of grp) {
    const d = byT.get(s.replace(/\.VN$/i, ""));
    const c = d && Array.isArray(d.c) ? d.c.filter((x) => x>0) : [];
    if (c.length < 6) continue;
    const price = c[c.length-1];                         // 풀 VND (×1000 X)
    const vol = Array.isArray(d.v) && d.v.length ? Number(d.v[d.v.length-1]) : 0;
    rows.push({ symbol: s, price, amount: price*vol,
      r1d: ret(c,1), r1w: ret(c,5), r1m: ret(c,21), r3m: ret(c,63), r6m: ret(c,126), r1y: ret(c,252),
      updated_at: at });
  }
  await new Promise((z) => setTimeout(z, 300));           // VCI 배려
}

for (let i=0;i<rows.length;i+=500) {
  const { error } = await sb.from("vn_stock_perf").upsert(rows.slice(i,i+500), { onConflict:"symbol" });
  if (error) { console.error(error); process.exit(1); }
}
console.log("computed", rows.length, "/", syms.length);
```

## 3. `.github/workflows/vn_perf.yml`
```yaml
name: VN Perf Cron
on:
  schedule:
    - cron: "0 9 * * *"   # 매일 09:00 UTC(=16:00 ICT·VN 장 마감 후)
  workflow_dispatch: {}
jobs:
  vn-perf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: npm i @supabase/supabase-js
      - name: Compute VN perf via VCI
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: node scripts/vn_perf_cron.mjs
```

## 4. Vercel vn-perf 크론 제거(충돌 방지) + 프로브 삭제
- `vercel.json`에서 `{ "path": "/api/cron/vn-perf", ... }` **블록 삭제**(Vercel 야후 크론이 VCI 데이터 덮어쓰지 않게). `/api/cron/vn-perf` 라우트·`lib/vnPerf.ts`는 남겨둬도 무방(호출 안 됨) — 또는 정리.
- `.github/workflows/vci_probe.yml` **삭제**(프로브 끝).

## 5. 🔑 GitHub Secrets 등록 (사용자 — Cowork/Claude Code 취급 불가)
리포 → Settings → Secrets and variables → Actions → New repository secret **2개**:
- `SUPABASE_URL` = 운종(Trillion) Supabase URL (`.env.local`의 값)
- `SUPABASE_SERVICE_ROLE_KEY` = SERVICE_ROLE 키 (`.env.local`의 값)
> ⚠️ SERVICE_ROLE 키는 비밀 — GitHub Secret(암호화)에만. 코드/로그에 노출 금지.

## 6. 커밋·푸시 → 수동 트리거 → 검증
```bash
npx tsc --noEmit   # (mjs는 tsc 대상 아니나 다른 변경 확인)
git add data/vn_symbols.json scripts/vn_perf_cron.mjs .github/workflows/vn_perf.yml vercel.json
git rm .github/workflows/vci_probe.yml
git commit -m "feat(vn): off-Vercel 크론(GitHub Actions+VCI)로 HOSE+HNX 702 perf — Vercel VCI IP차단 우회"
git push
# 시크릿 등록 후 수동 실행:
gh workflow run vn_perf.yml && sleep 40 && gh run view --log $(gh run list --workflow=vn_perf.yml -L1 --json databaseId -q '.[0].databaseId') | grep computed
# 검증(vn-list는 이미 vn_stock_perf 서빙):
curl -s "https://onetrillion.app/api/yahoo/vn-list" | python3 -c "import sys,json;d=json.load(sys.stdin)['items'];print('VN',len(d),'| HNX 포함?',any('SHS' in x['symbol'] for x in d),'| 상위3',[(x['symbol'],x['price']) for x in d[:3]])"
```
- `computed ~700` + vn-list에 HNX(SHS.VN 등) + **가격 풀 VND**(FPT ≈130,000) + 베트남어명 + 거래대금순.

## Cowork에게 보고
1. `computed` 수(≈700) + HNX 포함 + 가격 스케일 정상.
2. GH Actions 실행 시간·성공 여부(스케줄도 동작하는지 다음날 확인).
→ 이 패턴 확립 = **CN 소형주·다른 IP차단 소스도 같은 GH Actions 크론으로** 확장 가능. 플레이북 §8에 "VCI Vercel 소프트차단 → GitHub Actions(Azure IP) 우회" 기록. 다음 = Round 2(Chrome 라이브)·Round 3 or CN #2.
