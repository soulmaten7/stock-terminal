<!-- 2026-07-08 -->
# STEP 657B — 🇻🇳 VN 진짜 공시 재도전 (Vietstock 공시 AJAX)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** STEP 657 커밋됨(HEAD `04cae64`) — VnEventLayer가 **Google News RSS**로 붙어있음. 이번 STEP은 그걸 **진짜 공시(Vietstock)로 교체 시도.**
**목표:** VN 종목 페이지의 "공시층"을 US·KR·JP·GB와 동급인 **실제 규제 공시**(Vietstock 공시문서)로 바꾼다. **막히면 Google News를 유지하되 정직하게 라벨링**(뉴스임을 명시).

> 🔴 **왜 재도전인가:** STEP 657의 Google News는 *뉴스 헤드라인*이지 공식 공시가 아니고, VN 탭 R3 뉴스와 겹친다. 사용자 결정 = "진짜 공시 시도, 실패 시 Google News 회귀."
> 🔴 **Cowork 실측 확인:** TCBS 폐기·CafeF AJAX 빈값·**Vietstock 공시행은 서버 HTML에 없고 AJAX 로드**(토큰 필요). 그래서 이번엔 토큰 플로우를 태운다.
> ⚠️ **주의(중요):** VN 공식 공시 원문은 대개 **스캔 PDF**라 STEP 658 텍스트 요약(R1)이 안 될 수 있음 → 이 STEP에서 "원문 링크에 제목/텍스트가 있는지"까지 확인해 658 설계에 넘긴다.

---

## 🔴 0단계 — Vietstock 공시 AJAX 정찰 (curl로 실측 · 추측 금지)

Vietstock 공시문서는 `POST /data/getdocument` 형태의 AJAX로 온다(반-위조 토큰 + 세션쿠키 필요). **정확한 엔드포인트/파라미터/응답필드는 아래 스크립트로 실측**한 뒤 라우트를 짠다.

`tmp/vn_vs_probe.mjs` 생성 후 실행:

```js
// tmp/vn_vs_probe.mjs — Vietstock 공시 AJAX 정찰. node tmp/vn_vs_probe.mjs
const SYM = 'FPT';
const PAGE = `https://finance.vietstock.vn/${SYM}/tai-tai-lieu.htm`;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36';

// 1) 페이지 GET → 쿠키 + __RequestVerificationToken 확보
const g = await fetch(PAGE, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
const setCookies = g.headers.getSetCookie ? g.headers.getSetCookie() : [g.headers.get('set-cookie')].filter(Boolean);
const cookie = setCookies.map((c) => c.split(';')[0]).join('; ');
const html = await g.text();
const tok = (html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/) || [])[1] || '';
console.log('cookie:', cookie.slice(0, 120));
console.log('token:', tok.slice(0, 40), '(len', tok.length, ')');

// 2) getdocument POST (파라미터 후보 — 응답 보고 조정)
const bodies = [
  `code=${SYM}&type=&page=1&pageSize=20&__RequestVerificationToken=${encodeURIComponent(tok)}`,
  `Code=${SYM}&DocType=&Page=1&PageSize=20&__RequestVerificationToken=${encodeURIComponent(tok)}`,
];
for (const body of bodies) {
  try {
    const r = await fetch('https://finance.vietstock.vn/data/getdocument', {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': PAGE,
        'Cookie': cookie,
      },
      body,
      signal: AbortSignal.timeout(12000),
    });
    const t = await r.text();
    console.log(`\n=== POST [${r.status}] body="${body.slice(0,40)}..." len=${t.length} ===`);
    console.log(t.slice(0, 900));
  } catch (e) { console.log('POST FAIL', e.message); }
}
```

```bash
mkdir -p tmp && node tmp/vn_vs_probe.mjs 2>&1 | head -80
```

**판정:**
- **200 + 공시 배열(JSON)** 이 오면 → 실제 필드명 확인(제목=`Title`/`FileName`? 날짜=`PublicDate`/`UpdateTime`? 원문=`Url`/`FileUrl`? PDF 여부?) → **소스 = Vietstock 채택**, 1단계로.
- **토큰 불일치(500/403)** 나 **빈 배열**이면 → Referer/쿠키 다시 확인, 파라미터 후보 더 시도(위 2개로 안 되면 `finance.vietstock.vn` 개발자도구 캡처 기준으로 조정). **그래도 안 되면 = NO-GO** → 4단계(Google News 유지+정직 라벨)로.
- ⚠️ 응답의 원문 링크가 **PDF(스캔)면** STEP 658 R1이 텍스트 추출 안 될 수 있음 — 보고에 "PDF인지/제목 텍스트 있는지" 반드시 적기.

---

## 1단계 (GO인 경우) — `app/api/vn-events/route.ts`를 Vietstock 소스로 교체

STEP 657의 `route.ts`에서 **fetch/파싱 블록만** Vietstock 토큰 플로우로 교체(껍데기·캐시·NOISE/MATERIAL·`tickerOf`는 그대로). 핵심 형태:

```ts
// Vietstock 공시: 페이지 GET(토큰+쿠키) → getdocument POST(JSON) → events 매핑
async function fetchVietstock(ticker: string) {
  const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";
  const page = `https://finance.vietstock.vn/${ticker}/tai-tai-lieu.htm`;
  const g = await fetch(page, { headers: { "User-Agent": UA, Accept: "text/html" }, cache: "no-store", signal: AbortSignal.timeout(12000) });
  const cookie = (g.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  const html = await g.text();
  const tok = (html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/) || [])[1] || "";
  if (!tok) return [];
  const r = await fetch("https://finance.vietstock.vn/data/getdocument", {
    method: "POST",
    headers: { "User-Agent": UA, "X-Requested-With": "XMLHttpRequest", "Content-Type": "application/x-www-form-urlencoded", Referer: page, Cookie: cookie },
    // ▼ 0단계에서 확정한 파라미터명으로
    body: `code=${ticker}&type=&page=1&pageSize=20&__RequestVerificationToken=${encodeURIComponent(tok)}`,
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) return [];
  const arr = await r.json(); // ▼ 0단계 실측 구조로 매핑
  const rows = Array.isArray(arr) ? arr : (arr.data || arr.Data || []);
  return rows.map((d: Record<string, unknown>, i: number) => {
    const title = String(d.Title || d.FileName || d.title || "").trim();
    const date = String(d.PublicDate || d.UpdateTime || d.publicDate || "").slice(0, 10);
    const url = String(d.Url || d.FileUrl || d.url || "");
    const id = String(d.FileID || d.Id || url.match(/(\d{4,})/)?.[1] || i);
    return { id, title, date, source: "Vietstock", url, material: false };
  }).filter((e) => e.title);
}
```
- `GET` 핸들러에서 `const raw = await fetchVietstock(ticker);` → NOISE 필터 → `material: MATERIAL.test(title)` 재계산 → 최근 8건. (STEP 657 껍데기 재사용.)
- NOISE/MATERIAL 정규식은 STEP 657 것 유지(베트남어 키워드).

## 2단계 — 라벨을 "진짜 공시"로 (GO인 경우)
`StockLensClient.tsx`의 `VnEventLayer` 헤더 라벨을 공시로:
- 우측 태그 → `공시 · Vietstock`
- 하단 안내 → `클릭하면 원문(Vietstock 공시)으로 가요.`
- 헤더 제목 `최근 중대 공시` 유지 OK(이제 진짜 공시니까).

---

## 4단계 (NO-GO인 경우) — Google News 유지 + 정직 라벨
Vietstock가 로컬 또는 **Vercel에서 막히면**(도달성 0), STEP 657의 Google News 소스를 **그대로 두되 라벨만 정직하게** 바꾼다(뉴스를 공시로 위장 금지):
- `VnEventLayer` 헤더 제목 `최근 중대 공시` → **`최근 주요 뉴스·이벤트`**
- 우측 태그 `공시 · HOSE` → **`뉴스 · Google News`**
- 하단 안내 → `클릭하면 원문 뉴스로 가요.`
- 소개 문구 "렌즈 점수엔 아직 안 반영된 최신 공시예요" → "…최신 **뉴스·이벤트**예요"

> 이러면 US·KR·JP·GB=공식 공시, VN=뉴스·이벤트로 **정직하게 구분**됨. 완전성 원칙(소스 막히면 대체)도 지킴.

---

## 5단계 — 검증 → 커밋 (GO/NO-GO 공통)
```bash
npx tsc --noEmit           # EXIT 0
rm -f tmp/vn_vs_probe.mjs
pkill -f "next dev"; rm -rf .next && npm run dev
```
- 로컬: `localhost:3333/api/vn-events?symbol=FPT.VN` JSON 확인 → `/stock/FPT.VN`·`VIC.VN`·`VNM.VN` 렌더.
- 커밋:
```bash
git add "app/api/vn-events/route.ts" "app/stock/[symbol]/StockLensClient.tsx"
git commit -m "feat(vn): STEP 657B VN 공시 소스 Vietstock 재도전 (실패시 Google News 정직 라벨)"
git push
```
- **배포 후 필수 실측:** `curl "https://onetrillion.app/api/vn-events?symbol=FPT.VN"` → events 확인. Vietstock가 Vercel(데이터센터 IP)서 막히면(빈값) → 4단계 폴백으로 재커밋.

---

## Cowork에게 보고 (STEP 658 설계에 필수)
1. **GO / NO-GO** + 이유(0단계 정찰 결과: 상태코드·응답 구조).
2. GO면: 확정 파라미터명·응답 필드 매핑 + **원문 링크가 PDF인가/스캔인가/제목 텍스트 있나** (← R1 가능 여부 좌우).
3. 로컬 O / **Vercel 도달성 O·X**.
4. 최종 라벨(공시 vs 뉴스·이벤트).
→ 이걸로 STEP 658을 확정한다: Vietstock+텍스트원문이면 R1 요약, **PDF뿐이면 R1은 제목/메타 요약 또는 Google News 원문 요약으로 전환.**
