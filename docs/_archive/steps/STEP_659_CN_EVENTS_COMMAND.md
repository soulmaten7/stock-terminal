<!-- 2026-07-08 (2nd) -->
# STEP 659 — 🇨🇳 CN 공시 이벤트층 (`CnEventLayer` · cninfo A주)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** HEAD `1b8e1e1`(STEP 658, VN 마감). 공식 공시 R1 = US·KR·JP·GB 4개국.
**목표:** CN A주(`.SS`/`.SZ`) 종목 페이지에 "최근 중대 공시" 카드를 **cninfo(巨潮资讯网)** 로 붙인다. R1(원문 PDF 요약)은 다음 STEP 660. **HK(`.HK`)는 소스가 달라(HKEXnews) STEP 661로 분리**(하나씩 완전히 = 순서일 뿐 제외 아님).
**패턴:** `app/api/jp-events/route.ts` + `JpEventLayer`를 복제 후 소스만 cninfo로 교체.

> ✅ **VN과 다르다:** cninfo = 중국 증감회 지정 **공식 공시 사이트**(EDGAR/DART급). JSON API + PDF 원문. Cowork가 GET으로 홈페이지·공시행 구조 실측 완료. **단 Vercel(미 데이터센터 IP) 도달성은 배포 후 실측**(东方財富 IP차단 전례).

---

## 🔴 0단계 — cninfo API 프로브 먼저 (도달성 + 파라미터 실측)

> Cowork가 홈페이지 GET·파라미터 구조는 확인했으나, **공시 목록 POST API가 (a)로컬 (b)Vercel에서 JSON 주는지는 실측 필요.** 아래 스크립트로 확인 후 라우트 확정.
> ⚠️ **orgId 하드코딩 금지** — code마다 형식 제각각(gssz0000651·gssh0600138·9900002221·jjxt…). 반드시 topSearch로 조회.

`tmp/cn_probe.mjs` 생성 후 실행:

```js
// tmp/cn_probe.mjs — cninfo 공시 API 정찰. node tmp/cn_probe.mjs
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";
const H = { "User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "X-Requested-With": "XMLHttpRequest", Referer: "http://www.cninfo.com.cn/new/commonUrl?url=disclosure/list/search", Accept: "application/json,text/plain,*/*" };

// 1) code→orgId (topSearch) — 예: 000651(格力电器·SZ), 600519(贵州茅台·SS)
for (const code of ["000651", "600519"]) {
  const r = await fetch("http://www.cninfo.com.cn/new/information/topSearch/query", {
    method: "POST", headers: H, body: `keyWord=${code}&maxNum=10`, signal: AbortSignal.timeout(12000),
  });
  const t = await r.text();
  console.log(`\n=== topSearch ${code} [${r.status}] ===\n` + t.slice(0, 400));
}

// 2) 공시 목록 (hisAnnouncement/query) — orgId는 1)에서 얻은 값으로 바꿔 재실행
const code = "000651", orgId = "gssz0000651", column = "szse"; // ← 1) 결과로 교체
const body = `stock=${code},${orgId}&tabName=fulltext&pageSize=10&pageNum=1&column=${column}&isHLtitle=true`;
const r = await fetch("http://www.cninfo.com.cn/new/hisAnnouncement/query", {
  method: "POST", headers: H, body, signal: AbortSignal.timeout(12000),
});
const t = await r.text();
console.log(`\n=== hisAnnouncement ${code} [${r.status}] ===\n` + t.slice(0, 900));
```

```bash
mkdir -p tmp && node tmp/cn_probe.mjs 2>&1 | head -80
```

**판정:**
- topSearch 200 + `[{code, orgId, zwjc, category}]` → orgId 확보 방식 확정.
- hisAnnouncement 200 + `{announcements:[{announcementId, announcementTitle, announcementTime(ms), adjunctUrl, secCode, secName}], totalAnnouncement}` → 필드 매핑 확정.
- **막히면**(403/빈값/타임아웃): Referer·헤더 조정. 그래도 안 되면 Cowork 보고(东方財富식 IP차단일 수 있음 — Vercel은 더 확인 필요).

---

## 1단계 — `app/api/cn-events/route.ts` 생성

```ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 20;

// CN A주 최근 공시(cninfo·巨潮资讯网 = 증감회 지정 공식 공시). US(EDGAR)·KR(DART)·JP(EDINET)·GB(RNS)의 CN 짝.
// 회사별 온디맨드 + 10분 캐시. orgId는 code마다 형식 달라 topSearch로 조회(하드코딩 금지). 원문 = 静态 PDF.
const NOISE = [
  /减持|增持/, /质押|解押/, /持股.{0,4}(股东|变动)预/, /日常关联交易/, /融资融券/, /龙虎榜/,
];
const MATERIAL = /业绩|年度报告|半年度报告|季度报告|利润分配|分红|派息|回购|重大|收购|合并|重组|中标|重大合同|签署|战略合作|停牌|复牌|增发|定增|可转债|董事会决议|股东大会决议|业绩预告|预增|预减|扭亏|资产/;

// 심볼 → {code, column, plate}. .SZ=szse, .SS=sse.
function parse(symbol: string): { code: string; column: string } | null {
  const m = symbol.match(/^(\d{6})\.(SS|SZ)$/i);
  if (!m) return null;
  return { code: m[1], column: /SZ$/i.test(symbol) ? "szse" : "sse" };
}

const H = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
  "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
  "X-Requested-With": "XMLHttpRequest",
  Referer: "http://www.cninfo.com.cn/new/commonUrl?url=disclosure/list/search",
  Accept: "application/json,text/plain,*/*",
};

const orgCache = new Map<string, string>();          // code → orgId
const listCache = new Map<string, { at: number; data: unknown }>();

async function getOrgId(code: string): Promise<string> {
  if (orgCache.has(code)) return orgCache.get(code)!;
  const r = await fetch("http://www.cninfo.com.cn/new/information/topSearch/query", {
    method: "POST", headers: H, body: `keyWord=${code}&maxNum=10`, cache: "no-store", signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) return "";
  const arr = await r.json(); // [{code, orgId, zwjc, ...}]
  const hit = (Array.isArray(arr) ? arr : []).find((x: Record<string, string>) => x.code === code) || arr[0];
  const orgId = hit?.orgId || "";
  if (orgId) orgCache.set(code, orgId);
  return orgId;
}

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  const p = parse(symbol);
  if (!p) return NextResponse.json({ symbol, events: [] }); // .HK 등은 STEP 661에서

  const hit = listCache.get(p.code);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return NextResponse.json(hit.data);

  const events: { id: string; title: string; date: string; source: string; url: string; pdf: string; material: boolean }[] = [];
  try {
    const orgId = await getOrgId(p.code);
    if (orgId) {
      const body = `stock=${p.code},${orgId}&tabName=fulltext&pageSize=20&pageNum=1&column=${p.column}&isHLtitle=true`;
      const res = await fetch("http://www.cninfo.com.cn/new/hisAnnouncement/query", {
        method: "POST", headers: H, body, cache: "no-store", signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        const j = await res.json();
        const anns = j.announcements || [];
        const seen = new Set<string>();
        for (const a of anns) {
          if (events.length >= 8) break;
          const id = String(a.announcementId || "");
          const title = String(a.announcementTitle || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
          if (!id || !title || seen.has(id)) continue;
          if (NOISE.some((re) => re.test(title))) continue;
          seen.add(id);
          const date = a.announcementTime ? new Date(Number(a.announcementTime)).toISOString().slice(0, 10) : "";
          const pdf = a.adjunctUrl ? `http://static.cninfo.com.cn/${a.adjunctUrl}` : "";
          const web = `http://www.cninfo.com.cn/new/disclosure/detail?stockCode=${p.code}&orgId=${orgId}&announcementId=${id}&announcementTime=${date}`;
          events.push({ id, title, date, source: "cninfo", url: web, pdf, material: MATERIAL.test(title) });
        }
      }
    }
  } catch {
    /* graceful — 못 가져오면 빈 층(숨김) */
  }

  const out = { symbol, code: p.code, events };
  listCache.set(p.code, { at: Date.now(), data: out });
  return NextResponse.json(out);
}
```

> ⚠️ 0단계 실측에서 필드명(`announcements`·`announcementTitle`·`adjunctUrl` 등)이 다르면 매핑 조정. topSearch 응답이 `{keyBoardList} `등으로 감싸져 오면 `arr` 추출부 조정.

---

## 2단계 — `StockLensClient.tsx` 배선

**(a) 타입** — `GbEvent`/`VnEvent` 근처에:
```ts
type CnEvent = { id: string; title: string; date: string; source: string; url: string; pdf: string; material: boolean };
```

**(b) `CnEventLayer`** — `GbEventLayer` 복제 후 이름·엔드포인트·라벨 교체(제목은 진짜 공시라 "최근 중대 공시" 유지):
```tsx
function CnEventLayer({ symbol }: { symbol: string }) {
  const [events, setEvents] = useState<CnEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/cn-events?symbol=' + encodeURIComponent(symbol))
      .then((r) => r.json())
      .then((j) => { if (!alive) return; setEvents(j.events || []); setLoaded(true); })
      .catch(() => { if (alive) setLoaded(true); });
    return () => { alive = false; };
  }, [symbol]);
  if (!loaded || !events.length) return null;
  return (
    <div className="mt-3 rounded-2xl border border-unjong-border bg-white p-3.5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-unjong-primary">최근 중대 공시</span>
        <span className="text-[11px] text-unjong-muted">공시 · 巨潮资讯</span>
      </div>
      <p className="mt-0.5 text-[11px] leading-relaxed text-unjong-muted"><b className="text-unjong-primary">렌즈 점수엔 아직 안 반영</b>된 최신 공시예요.</p>
      <ul className="mt-2.5 space-y-1.5">
        {events.map((e) => (
          <li key={e.id}>
            <a href={e.url} target="_blank" rel="noopener noreferrer nofollow" className="group flex items-start gap-2 rounded-lg border border-unjong-border px-2.5 py-2 transition-colors hover:bg-unjong-background/40">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${e.material ? 'bg-unjong-accent' : 'bg-unjong-muted/40'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug text-unjong-primary">{e.title}{e.material && <span className="ml-1.5 rounded bg-unjong-accent/10 px-1 py-0.5 text-[10px] font-semibold text-unjong-accent">중대</span>}</p>
                <p className="mt-0.5 text-[11px] text-unjong-muted">{e.date}</p>
              </div>
              <ExternalLink size={12} className="mt-1 shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
            {/* STEP 660에서 <CnFilingSummary pdf={e.pdf} symbol={symbol} nm={e.title} id={e.id} /> 추가 */}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] leading-relaxed text-unjong-muted">클릭하면 원문(巨潮资讯网 공시)으로 가요.</p>
    </div>
  );
}
```

**(c) `isCN` 판별** — `isGB`/`isVN` 옆에:
```ts
const isCN = /\d{6}\.(SS|SZ)$/i.test(symbol); // CN A주 → cninfo 공시 층 (HK는 STEP 661)
```

**(d) 렌더 삼항식** — `isVN` 다음에 끼움:
```tsx
{isKR ? <KrEventLayer symbol={symbol} /> : isJP ? <JpEventLayer symbol={symbol} /> : isGB ? <GbEventLayer symbol={symbol} /> : isVN ? <VnEventLayer symbol={symbol} /> : isCN ? <CnEventLayer symbol={symbol} /> : <EventLayer events={events} symbol={symbol} />}
```

---

## 3단계 — 검증 → 커밋
```bash
npx tsc --noEmit          # EXIT 0
rm -f tmp/cn_probe.mjs
pkill -f "next dev"; rm -rf .next && npm run dev
```
- 로컬: `localhost:3333/api/cn-events?symbol=000651.SZ`·`600519.SS`(格力电器·贵州茅台) JSON 확인 → 종목 페이지 카드 렌더(比亚迪 002594.SZ·宁德时代 300750.SZ도).
- console.log 금지. 빌드 깨진 채 커밋 금지.
```bash
git add app/api/cn-events/route.ts "app/stock/[symbol]/StockLensClient.tsx"
git commit -m "feat(cn): STEP 659 CN A주 공시 이벤트층 CnEventLayer (cninfo 공식 공시·topSearch orgId+hisAnnouncement·온디맨드+캐시)"
git push
```
- **배포 후 필수 실측**(최대 관건): `curl "https://onetrillion.app/api/cn-events?symbol=000651.SZ"` → events 확인. **빈값이면 Vercel IP 차단**(东方財富 전례) → 헤더 조정 or 프록시 검토 후 Cowork 보고.

---

## Cowork에게 보고 (STEP 660 R1 설계에 필수)
1. 0단계 프로브 결과: topSearch·hisAnnouncement 상태코드·응답 구조(필드명 실측).
2. **Vercel 도달성 O·X** (cninfo가 프로덕션서 되는지 — 가장 중요).
3. `adjunctUrl` PDF 예시 1개 — **텍스트 PDF인가/스캔인가**(R1 추출 가능 여부 좌우).
→ 이걸로 STEP 660(PDF 원문→중국어→한국어 R1) 확정. 그다음 STEP 661(HK·HKEXnews).
