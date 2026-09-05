<!-- 2026-07-08 -->
# STEP 657 — 🇻🇳 VN 공시 이벤트층 (`VnEventLayer`)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** HEAD `fef75ee` (STEP 654, 공시 R1 = US·KR·JP·GB 4개국).
**목표:** VN 종목 페이지(`/stock/{TICKER}.VN`)에 "최근 중대 공시" 카드를 GB(`GbEventLayer`)와 **완전 동급**으로 붙인다. 원문요약(R1)은 다음 STEP 658.
**패턴:** `app/api/gb-events/route.ts` + `StockLensClient.tsx`의 `GbEventLayer`를 **복제 후 소스만 교체.**

---

## 🔴 0단계 — 소스 실측 먼저 (추측 금지 · 반드시 이것부터)

> Cowork(설계자)는 `web_fetch`로 JSON/AJAX 본문을 못 봐서 **엔드포인트를 확정하지 못했다.** 너(Claude Code)는 실제 `fetch()`로 응답을 볼 수 있으니 **먼저 아래 정찰 스크립트를 돌려 어떤 소스가 살아있는지 확인**하고, 그 결과로 라우트를 만든다.
> 과거 교훈: TCBS `tcanalysis/v1/ticker/{sym}/...` 경로는 **404(폐기)**. 새 경로는 실측으로만.

프로젝트 루트에 임시 파일 `tmp/vn_probe.mjs` 생성 후 실행:

```js
// tmp/vn_probe.mjs — VN 공시 소스 정찰. node tmp/vn_probe.mjs
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; TrillionBot/1.0; +https://onetrillion.app)', 'Accept': 'text/html,application/json' };
const SYM = 'FPT';
const cands = [
  // --- 후보 A: TCBS 공개 JSON (tcanalysis 새 경로 후보들) ---
  ['TCBS company/events',        `https://apipubaws.tcbs.com.vn/tcanalysis/v1/company/${SYM}/events?fType=events&page=0&size=20`],
  ['TCBS company/activity-news', `https://apipubaws.tcbs.com.vn/tcanalysis/v1/company/${SYM}/activity-news?page=0&size=20`],
  ['TCBS ticker/events-news',    `https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/${SYM}/events-news?page=0&size=20&fType=events`],
  // --- 후보 B: CafeF AJAX 프래그먼트 (뉴스+공시, 원문 링크 포함) ---
  ['CafeF Events_RelatedNews',   `https://s.cafef.vn/Ajax/Events_RelatedNews_New.aspx?symbol=${SYM}&floorID=0&configID=0&PageIndex=1&PageSize=20&Type=2`],
];
for (const [name, url] of cands) {
  try {
    const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(12000) });
    const t = await r.text();
    console.log(`\n===== ${name} [${r.status}] len=${t.length} =====`);
    console.log(t.slice(0, 700));
  } catch (e) { console.log(`\n===== ${name} FAIL: ${e.message} =====`); }
}
```

```bash
mkdir -p tmp && node tmp/vn_probe.mjs 2>&1 | head -120
```

**판정:**
- **A(TCBS JSON)가 200 + 실제 공시 배열**이면 → 소스 A 채택(깔끔·ToS 부담 적음). 응답의 실제 필드명(제목·날짜·id·원문url)을 확인해 파서를 맞춘다.
- A가 전부 404/빈값이면 → **B(CafeF) 채택.** CafeF는 HTML 프래그먼트(`<a href="원문url">제목</a>` + 날짜)를 돌려준다. **실제 반환된 markup을 보고** 아래 파서 regex를 실측 구조에 맞춘다(GB Investegate 때와 동일 방식).
- 둘 다 막히면 Vietstock(`finance.vietstock.vn`) 서버렌더 폴백 — 이 경우 Cowork에게 보고하고 STEP 재설계.

> ⚠️ **Vercel 도달성이 최대 리스크.** 로컬에서 되더라도 프로덕션(데이터센터 IP)에서 차단될 수 있다(전례: 东方財富 CN 차단). 배포 후 반드시 `onetrillion.app/api/vn-events?symbol=FPT.VN` 직접 호출로 재확인.

---

## 1단계 — `app/api/vn-events/route.ts` 생성

`gb-events/route.ts`를 복제한 뒤, **0단계에서 확정한 소스**로 fetch·파싱만 교체한다. 아래는 **CafeF(소스 B) 기준 스켈레톤** — 소스 A(TCBS JSON)를 채택했으면 `fetch`+파싱 블록을 JSON 매핑으로 바꾼다(구조는 동일: `events[]` 배열을 만들어 `{ id, title, date, source, url, material }` 형태로).

```ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 20;

// VN 종목 최근 공시. 회사별 페이지라 온디맨드(크론 X)·10분 캐시.
// US(EDGAR)·KR(DART)·JP(EDINET)·GB(RNS)의 VN 짝. 소스 = 0단계 실측으로 확정(CafeF 또는 TCBS).
// 원문은 소스 원문 URL로 링크(귀속). 노이즈(단순 거래·내부자 잡음) 제외 후 실이벤트만.
const NOISE = [
  /giao dịch cổ phiếu/i, /người nội bộ/i, /người có liên quan/i, // 내부자/관계자 주식거래
  /thay đổi số lượng cổ phiếu/i, /kết quả giao dịch/i, /đăng ký (mua|bán)/i,
];
// 제목에 실이벤트 키워드(베트남어)가 있으면 "중대" 배지.
const MATERIAL = /kết quả kinh doanh|doanh thu|lợi nhuận|cổ tức|đại hội|nghị quyết|báo cáo tài chính|phát hành|sáp nhập|mua lại|hợp đồng|dự án|kế hoạch|bổ nhiệm|từ nhiệm|quý [1-4]|đầu tư|chiến lược|hủy niêm yết|niêm yết/i;

function tickerOf(symbol: string): string | null {
  const m = symbol.match(/^([A-Za-z0-9]+)\.VN$/i);
  return m ? m[1].toUpperCase() : null;
}

const cache = new Map<string, { at: number; data: unknown }>();
const UA = { "User-Agent": "Mozilla/5.0 (compatible; TrillionBot/1.0; +https://onetrillion.app)", Accept: "text/html,application/json" };

export async function GET(req: NextRequest) {
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  const ticker = tickerOf(symbol);
  if (!ticker) return NextResponse.json({ symbol, events: [] });

  const hit = cache.get(ticker);
  if (hit && Date.now() - hit.at < 10 * 60 * 1000) return NextResponse.json(hit.data);

  const events: { id: string; title: string; date: string; source: string; url: string; material: boolean }[] = [];
  try {
    // ▼▼▼ 0단계에서 확정한 소스로 교체 (아래는 CafeF AJAX 프래그먼트 예시) ▼▼▼
    const res = await fetch(
      `https://s.cafef.vn/Ajax/Events_RelatedNews_New.aspx?symbol=${encodeURIComponent(ticker)}&floorID=0&configID=0&PageIndex=1&PageSize=20&Type=2`,
      { headers: UA, cache: "no-store", signal: AbortSignal.timeout(15000) },
    );
    if (res.ok) {
      const html = await res.text();
      // 🔴 실제 반환된 markup 구조를 보고 regex 확정 (아래는 초안 — 반드시 실측 후 조정)
      const rowRe = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(\d{2}\/\d{2}\/\d{4})/g;
      const seen = new Set<string>();
      let m: RegExpExecArray | null;
      while ((m = rowRe.exec(html)) && events.length < 8) {
        const [, rawUrl, rawTitle, date] = m;
        const url = rawUrl.startsWith("http") ? rawUrl : `https://s.cafef.vn${rawUrl}`;
        const title = rawTitle.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
        const id = (url.match(/(\d{4,})/) || [])[1] || String(events.length);
        if (!title || title.length < 8 || seen.has(id)) continue;
        if (NOISE.some((re) => re.test(title))) continue;
        seen.add(id);
        events.push({ id, title, date, source: "CafeF", url, material: MATERIAL.test(title) });
      }
    }
    // ▲▲▲ 소스 교체 끝 ▲▲▲
  } catch {
    /* graceful — 못 가져오면 빈 층(숨김) */
  }

  const out = { symbol, ticker, events };
  cache.set(ticker, { at: Date.now(), data: out });
  return NextResponse.json(out);
}
```

> **소스 A(TCBS JSON) 채택 시:** `fetch` URL을 확정된 TCBS 엔드포인트로 바꾸고, `const j = await res.json();` 후 `j.listActivityNews`(또는 실제 배열 필드) 를 map 해서 `{ id, title, date, source:"TCBS", url, material }` 를 채운다. 날짜·제목·원문url 필드명은 0단계 실측값 사용.

---

## 2단계 — `StockLensClient.tsx` 배선

**(a) 타입 추가** — `GbEvent` 타입(475행 근처) 아래에:
```ts
type VnEvent = { id: string; title: string; date: string; source: string; url: string; material: boolean };
```

**(b) `VnEventLayer` 추가** — `GbEventLayer`(503~540행) 전체를 복제해 이름만 `VnEventLayer`/`VnEvent`로 바꾸고, 라벨 3곳만 교체:
- `fetch('/api/vn-events?symbol=' ...)` (엔드포인트)
- 헤더 우측 라벨 `RNS · LSE` → `공시 · HOSE` (소스 A면 `공시 · TCBS`, B면 `공시 · CafeF`)
- 하단 안내 `클릭하면 원문(Investegate·RNS)으로 가요.` → `클릭하면 원문(CafeF·공시)으로 가요.`
- 내부 요약 컴포넌트는 STEP 658에서 붙일 `<VnFilingSummary .../>` 자리만 남겨둔다(이번 STEP엔 요약 컴포넌트 없이 리스트만; 658에서 추가).

```tsx
type VnEvent = { id: string; title: string; date: string; source: string; url: string; material: boolean };
function VnEventLayer({ symbol }: { symbol: string }) {
  const [events, setEvents] = useState<VnEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch('/api/vn-events?symbol=' + encodeURIComponent(symbol))
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
        <span className="text-[11px] text-unjong-muted">공시 · HOSE</span>
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
            {/* STEP 658에서 <VnFilingSummary url={e.url} symbol={symbol} nm={e.title} /> 추가 */}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] leading-relaxed text-unjong-muted">클릭하면 원문(CafeF·공시)으로 가요.</p>
    </div>
  );
}
```

**(c) `isVN` 판별 추가** — `isGB`(715행) 옆에:
```ts
const isVN = /\.VN$/i.test(symbol); // VN {TICKER}.VN → 공시 층(CafeF/TCBS)
```

**(d) 렌더 삼항식 배선**(852행) — `isVN`을 `isGB` 다음에 끼운다:
```tsx
{isKR ? <KrEventLayer symbol={symbol} /> : isJP ? <JpEventLayer symbol={symbol} /> : isGB ? <GbEventLayer symbol={symbol} /> : isVN ? <VnEventLayer symbol={symbol} /> : <EventLayer events={events} symbol={symbol} />}
```

---

## 3단계 — 검증 → 커밋

```bash
npx tsc --noEmit          # EXIT 0 확인
rm -f tmp/vn_probe.mjs     # 정찰 스크립트 정리
```
- 로컬: API 라우트 새로 생겼으니 클린 재시작 `pkill -f "next dev"; rm -rf .next && npm run dev` → `localhost:3333/api/vn-events?symbol=FPT.VN` JSON 확인 → `/stock/FPT.VN` 페이지에 "최근 중대 공시" 카드 렌더 확인(FPT·VIC·VNM로 3종목 확인).
- **console.log 남기지 말 것.** 빌드 깨진 채 커밋 금지.

```bash
git add app/api/vn-events/route.ts "app/stock/[symbol]/StockLensClient.tsx"
git commit -m "feat(vn): STEP 657 VN 공시 이벤트층 VnEventLayer (US·KR·JP·GB 공시층의 VN 짝, 소스=CafeF/TCBS 온디맨드+10분캐시)"
git push
```

- 배포 후 **라이브 도달성 실측**(최대 관건): `curl "https://onetrillion.app/api/vn-events?symbol=FPT.VN"` → events 배열 확인. **비었으면 Vercel IP 차단 의심** → UA/헤더 조정 또는 소스 교체(CafeF↔TCBS) 후 재배포. Cowork에게 결과 보고.

---

## 커밋 후 Cowork에게 보고할 것
1. 채택한 소스(A TCBS JSON / B CafeF / Vietstock) + 그 이유(0단계 정찰 결과).
2. 실제 파서 regex/JSON 매핑 최종형(초안에서 뭘 바꿨는지).
3. 라이브 도달성 결과(로컬 O / Vercel O·X).
→ 이걸로 STEP 658(R1 요약)의 상세 추출 방식을 확정한다.
