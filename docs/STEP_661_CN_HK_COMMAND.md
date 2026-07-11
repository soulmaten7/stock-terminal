<!-- 2026-07-08 (2nd) -->
# STEP 661 — 🇭🇰 CN HK 공시층 + R1 (HKEXnews) · CN 완결

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** STEP 660 커밋됨(HEAD `73dfc9b`) — CN A주(`.SS`/`.SZ`) 공시층+R1 완성(cninfo). CnEventLayer·CnFilingSummary·isCN 존재.
**목표:** CN 탭의 **홍콩(`.HK`)** 종목에 공시층+R1을 **HKEXnews**(홍콩거래소 공식 공시)로 붙여 **CN 완결**(A주+HK). → 공식 공시 = US·KR·JP·GB·CN(A주+HK).
**설계:** 기존 `CnEventLayer`·`CnFilingSummary` **재사용**. `cn-events` 라우트에 HK 브랜치 추가 + `isCN`에 `.HK` 포함 + `cn-events/summary` SSRF 허용에 hkexnews 추가. (새 컴포넌트 없음 = 최소 변경.)

> ✅ HKEXnews = 홍콩거래소 지정 공식 공시(cninfo의 HK 짝). 원문 PDF(대개 텍스트·영문/번체 병기).
> ⚠️ Vercel 도달성은 배포 후 실측(cninfo는 통과했는지 STEP 660 결과 참고 · HK는 별도 호스트라 또 확인).

---

## 🔴 0단계 — HKEXnews API 프로브 (추측 금지)

HK는 **code→stockId 조회 후 titleSearch**. 정확한 엔드포인트/응답을 실측 후 라우트 확정.

`tmp/hk_probe.mjs`:
```js
// tmp/hk_probe.mjs — HKEXnews 정찰. node tmp/hk_probe.mjs
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";
const code5 = "00700"; // 텐센트(0700.HK) → 5자리 패딩

// 1) code→stockId (prefix.do — 후보). callback 없이 JSON 시도.
for (const url of [
  `https://www1.hkexnews.hk/search/prefix.do?callback=c&lang=EN&type=A&name=${code5}&market=SEHK`,
  `https://www1.hkexnews.hk/hkexnews/search/prefix.do?callback=c&lang=EN&type=A&name=${code5}&market=SEHK`,
]) {
  try { const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(12000) });
    console.log(`\n=== prefix [${r.status}] ${url.slice(0,60)} ===\n` + (await r.text()).slice(0, 500)); }
  catch (e) { console.log("prefix FAIL", e.message); }
}

// 2) titleSearchServlet.do (stockId는 1)에서 얻은 값으로 교체). 최근 90일.
const stockId = "2696"; // ← 1) 결과로 교체(예시)
const today = new Date(), from = new Date(Date.now() - 90 * 864e5);
const fmt = (d) => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
const url = `https://www1.hkexnews.hk/search/titleSearchServlet.do?sortDir=0&sortByOptions=DateTime&category=0&market=SEHK&stockId=${stockId}&documentType=-1&fromDate=${fmt(from)}&toDate=${fmt(today)}&title=&stockName=&t1code=-2&t2Gcode=-2&t2code=-2&rowRange=20&lang=E`;
try { const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(12000) });
  console.log(`\n=== titleSearch [${r.status}] ===\n` + (await r.text()).slice(0, 1000)); }
catch (e) { console.log("titleSearch FAIL", e.message); }
```
```bash
mkdir -p tmp && node tmp/hk_probe.mjs 2>&1 | head -80
```

**판정:**
- prefix 200 + stockId 포함 JSON → code→stockId 방식 확정(응답이 `{stockId, name, code}` 배열인지 확인).
- titleSearch 200 + `{result:"[{DATE_TIME,TITLE,FILE_LINK,FILE_TYPE,STOCK_CODE,...}]"}`(result가 **JSON 문자열**일 수 있음 → `JSON.parse` 필요) → 필드 매핑 확정. FILE_LINK는 상대경로 → `https://www1.hkexnews.hk`+FILE_LINK.
- 막히면 헤더 조정 or `www1`↔`www2`↔`www3` 호스트 교체 시도. 그래도 안 되면 Cowork 보고(HK만 보류하고 A주로 CN 부분완결 판단).

---

## 1단계 — `app/api/cn-events/route.ts`에 HK 브랜치 추가

기존 파일 상단(A주 `parse`·`H`·캐시 옆)에 HK 처리 추가:

```ts
// HK: 5자리 패딩 code. HKEXnews stockId 조회 후 titleSearch.
const hkIdCache = new Map<string, string>();
function hkCode(symbol: string): string | null {
  const m = symbol.match(/^(\d{1,5})\.HK$/i);
  return m ? m[1].padStart(5, "0") : null;
}
async function hkStockId(code5: string): Promise<string> {
  if (hkIdCache.has(code5)) return hkIdCache.get(code5)!;
  const r = await fetch(`https://www1.hkexnews.hk/search/prefix.do?callback=c&lang=EN&type=A&name=${code5}&market=SEHK`,
    { headers: { "User-Agent": H["User-Agent"] }, cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!r.ok) return "";
  const txt = await r.text();                              // JSONP: c({stockInfo:[...]})
  const j = JSON.parse(txt.replace(/^[^(]*\(/, "").replace(/\)\s*;?\s*$/, ""));
  const list = j.stockInfo || j.data || [];
  const hit = list.find((x: Record<string, string>) => String(x.code).padStart(5, "0") === code5) || list[0];
  const id = hit ? String(hit.stockId) : "";
  if (id) hkIdCache.set(code5, id);
  return id;
}
const MATERIAL_HK = /result|interim|annual|final|dividend|distribution|acquisi|disposal|merger|connected transaction|profit|earnings|placing|buy.?back|repurchase|change|appoint|resign|agreement|contract|業績|中期|年度|股息|收購|合併|回購|公告/i;

async function fetchHK(code5: string) {
  const stockId = await hkStockId(code5);
  if (!stockId) return [];
  const today = new Date(), from = new Date(Date.now() - 180 * 864e5);
  const fmt = (d: Date) => `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const url = `https://www1.hkexnews.hk/search/titleSearchServlet.do?sortDir=0&sortByOptions=DateTime&category=0&market=SEHK&stockId=${stockId}&documentType=-1&fromDate=${fmt(from)}&toDate=${fmt(today)}&title=&stockName=&t1code=-2&t2Gcode=-2&t2code=-2&rowRange=20&lang=E`;
  const r = await fetch(url, { headers: { "User-Agent": H["User-Agent"], Accept: "application/json,*/*" }, cache: "no-store", signal: AbortSignal.timeout(12000) });
  if (!r.ok) return [];
  const j = await r.json();
  const rows = typeof j.result === "string" ? JSON.parse(j.result) : (j.result || []);
  const out: { id: string; title: string; date: string; source: string; url: string; pdf: string; material: boolean }[] = [];
  const seen = new Set<string>();
  for (const a of rows) {
    if (out.length >= 8) break;
    const title = String(a.TITLE || a.title || "").replace(/\s+/g, " ").trim();
    const link = String(a.FILE_LINK || a.file_link || "");
    if (!title || !link) continue;
    const pdf = link.startsWith("http") ? link : `https://www1.hkexnews.hk${link}`;
    const id = (pdf.match(/\/(\d{5,})[^/]*\.(pdf|htm)/i) || [])[1] || String(out.length);
    if (seen.has(id)) continue; seen.add(id);
    const dt = String(a.DATE_TIME || a.dateTime || "");
    const date = dt.slice(0, 10).replace(/\//g, "-");
    out.push({ id, title, date, source: "HKEXnews", url: pdf, pdf, material: MATERIAL_HK.test(title) });
  }
  return out;
}
```

`GET` 핸들러 수정 — A주 `parse` 앞에 HK 먼저 분기:
```ts
export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();

  // HK 분기
  const hc = hkCode(symbol);
  if (hc) {
    const hit = listCache.get("HK" + hc);
    if (hit && Date.now() - hit.at < 10 * 60 * 1000) return NextResponse.json(hit.data);
    let events: unknown[] = [];
    try { events = await fetchHK(hc); } catch { /* graceful */ }
    const out = { symbol, code: hc, events };
    listCache.set("HK" + hc, { at: Date.now(), data: out });
    return NextResponse.json(out);
  }

  const p = parse(symbol);
  if (!p) return NextResponse.json({ symbol, events: [] });
  // ... (기존 A주 로직 그대로)
}
```
> 0단계 실측으로 prefix 응답 래핑(JSONP `stockInfo`)·titleSearch `result`(문자열 여부)·필드명(대문자 TITLE/FILE_LINK/DATE_TIME) 확정 후 맞춤.

---

## 2단계 — `StockLensClient.tsx`: `isCN`에 `.HK` 포함
```ts
const isCN = /(\d{6}\.(SS|SZ)|\d{1,5}\.HK)$/i.test(symbol); // A주 cninfo + HK HKEXnews
```
> CnEventLayer·CnFilingSummary는 그대로 재사용(엔드포인트 동일 `/api/cn-events`·`/api/cn-events/summary`). 라벨 "공시 · 巨潮资讯"이 HK엔 안 맞으니, CnEventLayer 헤더 우측 라벨을 소스에 맞게 **동적**으로: `events[0]?.source === 'HKEXnews' ? '공시 · HKEX' : '공시 · 巨潮资讯'` (선택 · 안 하면 巨潮 고정이라 사소한 부정확).

## 3단계 — `app/api/cn-events/summary/route.ts`: hkexnews 허용 + accession 분리
```ts
// SSRF: cninfo 정적 PDF + hkexnews PDF 허용
const okCninfo = /^https?:\/\/static\.cninfo\.com\.cn\/.+\.PDF$/i.test(pdf);
const okHkex = /^https?:\/\/www\d?\.hkexnews\.hk\/.+\.(pdf|PDF)$/i.test(pdf);
if ((!okCninfo && !okHkex) || !id) return NextResponse.json({ error: "bad url" }, { status: 400 });
const acc = (okHkex ? "HK" : "CN") + id;
```
- Referer는 소스에 맞게: hkex면 `https://www1.hkexnews.hk/`.
- 시스템 프롬프트 "중국어" → **"중국어 또는 영어"** 로(HK 공시는 영문/번체 병기). 한국어 아님→번역 폴백이 이미 있어 영문도 커버.

---

## 4단계 — 검증 → 커밋
```bash
npx tsc --noEmit          # EXIT 0
rm -f tmp/hk_probe.mjs
pkill -f "next dev"; rm -rf .next && npm run dev
```
- 로컬: `/api/cn-events?symbol=0700.HK`(텐센트)·`9988.HK`(알리바바)·`1299.HK`(AIA) JSON 확인 → 종목 페이지 공시층 + 밑에 한국어 요약.
- A주 회귀 확인: `000651.SZ`·`600519.SS` 여전히 정상(HK 브랜치가 A주 안 깨뜨렸는지).
- 스캔 PDF·요약 실패는 숨김 정상. console.log 금지.
```bash
git add app/api/cn-events/route.ts app/api/cn-events/summary/route.ts "app/stock/[symbol]/StockLensClient.tsx"
git commit -m "feat(cn): STEP 661 HK 공시층+R1 HKEXnews (CnEventLayer/CnFilingSummary 재사용·isCN에 .HK·summary allowlist 확장) — CN 완결"
git push
```
- **배포 후 실측**: `curl "https://onetrillion.app/api/cn-events?symbol=0700.HK"` → events + `/stock/0700.HK` 요약 렌더. HKEXnews가 Vercel서 막히면 헤더/호스트 조정 or Cowork 보고.

---

## 5단계 — CN 완결 문서 마감(Claude Code가 4개 날짜만 오늘로)
STEP 659·660·661 묶어 CHANGELOG 한 줄("CN 공시 완결 = A주 cninfo + HK HKEXnews, R1 5개국+HK") + 4개 문서 헤더 날짜. 상세(SESSION_BOOT·HANDOFF·다음=광고 대화)는 Cowork.

## Cowork에게 보고
1. 0단계 프로브: prefix·titleSearch 상태코드·응답 구조(result 문자열 여부·필드명).
2. **Vercel 도달성 O·X**(HKEXnews 목록 + PDF).
3. HK PDF 텍스트/스캔 여부 + 텐센트/알리바바 요약 품질.
4. A주 회귀 정상 여부.
→ CN 완결 후 다음 = **광고(대화 먼저 — 사용자 지침)** 또는 국가 추가(인도·대만).
