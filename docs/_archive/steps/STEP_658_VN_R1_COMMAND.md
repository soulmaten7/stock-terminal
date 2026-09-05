<!-- 2026-07-08 -->
# STEP 658 — 🇻🇳 VN R1 원문요약 (`VnFilingSummary` · 기사 본문 요약)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** STEP 657B 커밋됨(HEAD `5459b0b`) — VnEventLayer = **Google News RSS**, 라벨 "최근 주요 뉴스·이벤트 · Google News". 각 항목 `e.url` = `https://news.google.com/rss/articles/...` (구글뉴스 리다이렉트 링크).
**목표:** VN 각 뉴스·이벤트 항목 아래에 **원문 기사(베트남어) → 한국어 사실 요약**(`VnFilingSummary`)을 붙인다. 다른 4개국 R1과 시각적 동급.
**패턴:** `app/api/gb-events/summary/route.ts` + `GbFilingSummary` 복제 후 소스/추출/폴백 교체.

> ⚠️ **사용자 인지된 트레이드오프:** VN엔 공식 공시·클린 원문이 없어 소스가 구글뉴스 기사다. 구글뉴스 링크(인코딩·consent 인터스티셜)는 서버서 원문으로 **항상 resolve되진 않는다** → **안 풀리는 항목은 조용히 숨김**(GbFilingSummary처럼). 일부만 요약 떠도 정상. 이게 이번 STEP의 수용된 한계.

---

## 1단계 — `app/api/vn-events/summary/route.ts` 생성

핵심: (a) 입력 SSRF = `news.google.com`만, (b) 구글뉴스 링크 fetch(리다이렉트 따라감)→최종 기사 HTML, (c) 본문 추출, (d) 짧거나 구글 인터스티셜이면 실패(숨김), (e) 한국어 요약 + "한국어 아님→번역" 폴백(R3 방식) + 동(₫) 통화 교정.

```ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

// R1-VN: Google News 링크 → 원문 기사(베트남어) → 한국어 '사실' 요약. US/KR/JP/GB R1의 VN 짝.
// VN은 공식 공시원문이 없어 뉴스 기사 기반. 구글뉴스 링크가 원문으로 resolve 안 되면 조용히 숨김.
// 전역 캐시(filing_summaries, accession='VN'+id). 예측·판정 금지.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

function extractArticle(html: string): string {
  // <article> 우선 → 없으면 본문 <p> 모음. 스크립트/스타일 제거.
  let seg = "";
  const art = html.match(/<article\b[\s\S]*?<\/article>/i);
  if (art) seg = art[0];
  else {
    const ps = html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) || [];
    seg = ps.slice(0, 40).join(" ");
  }
  const text = seg
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ").trim();
  return text.slice(0, 12000);
}

export async function GET(req: NextRequest) {
  const url = (req.nextUrl.searchParams.get("url") || "").trim();
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  const nm = req.nextUrl.searchParams.get("nm") || "";
  const id = (req.nextUrl.searchParams.get("id") || "").trim();
  // SSRF 방지 — 구글뉴스 링크만 허용(리다이렉트는 공개 언론사로만 감).
  if (!/^https:\/\/news\.google\.com\//i.test(url) || !id) {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }
  const acc = "VN" + id;

  const sb = createAdminClient();
  const { data: hit } = await sb.from("filing_summaries").select("summary_ko").eq("accession", acc).maybeSingle();
  if (hit?.summary_ko) return NextResponse.json({ summary: hit.summary_ko, cached: true });

  // 구글뉴스 링크 → 최종 기사(리다이렉트 따라감)
  let text = "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html", "Accept-Language": "vi-VN,vi;q=0.9" },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const finalUrl = res.url || "";
      // 여전히 구글 도메인이면 원문 resolve 실패(인터스티셜) → 숨김
      if (!/news\.google\.com|consent\.google\.com/i.test(finalUrl)) {
        text = extractArticle(await res.text());
      }
    }
  } catch { /* graceful */ }
  if (!text || text.length < 120) return NextResponse.json({ error: "no extractable text" }, { status: 502 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "당신은 베트남 증시 기사(베트남어)를 한국 개인투자자에게 사실만 전달하는 애널리스트입니다. 기사에 실제로 쓰인 내용만 2~3문장 한국어로 요약합니다. 규칙: (1) 예측·전망·투자 추천(사라/팔아라·목표가) 절대 금지 (2) 기사에 없는 내용 추가 금지 (3) \"무슨 일이 일어났는지\" 사실만(금액·비율·일정 등) (4) 숫자·통화(동 ₫)는 원문 그대로 (5) 반드시 한국어로, 해요체·군더더기 없이. 영어·베트남어로 답하지 마세요.",
        },
        {
          role: "user",
          content: `베트남 증시 기사(${nm || "제목없음"}) 원문(베트남어)입니다. 무슨 일이 일어났는지 한국어로 2~3문장 사실 요약:\n\n${text}`,
        },
      ],
      max_tokens: 320,
      temperature: 0.2,
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return NextResponse.json({ error: `llm ${res.status}` }, { status: 502 });
  const j = await res.json();
  let summary = (j.choices?.[0]?.message?.content || "").trim();
  if (!summary) return NextResponse.json({ error: "llm empty" }, { status: 502 });

  // 후처리1: 한국어 아니면 번역(R3 방식 — 베트남어/영어 출력 방어)
  if (!/[가-힣]/.test(summary)) {
    try {
      const tr = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "다음을 자연스러운 한국어(해요체)로 옮깁니다. 내용 추가·의견 금지, 사실만." },
            { role: "user", content: summary },
          ],
          max_tokens: 320, temperature: 0.2,
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (tr.ok) { const t = (((await tr.json()).choices?.[0]?.message?.content) || "").trim(); if (/[가-힣]/.test(t)) summary = t; }
    } catch { /* 유지 */ }
  }
  // 후처리2: 통화 교정 — 베트남 동(숫자 뒤 '원'→'동'). '원가·원인' 등 일반어(앞이 숫자 아님)는 안 건드림.
  summary = summary.replace(/(\d[\d,.]*\s*[조억만천]?\s*)원/g, "$1동");

  await sb.from("filing_summaries").upsert(
    { accession: acc, symbol, summary_ko: summary, model: "gpt-4o-mini" },
    { onConflict: "accession" },
  );
  return NextResponse.json({ summary, cached: false });
}
```

---

## 2단계 — `StockLensClient.tsx`: `VnFilingSummary` + VnEventLayer 배선

**(a) `VnFilingSummary` 추가** — `GbFilingSummary`(477행 근처) 복제, 엔드포인트만 교체 + `id`도 쿼리에:
```tsx
function VnFilingSummary({ url, symbol, nm, id }: { url: string; symbol: string; nm: string; id: string }) {
  const [text, setText] = useState('');
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  useEffect(() => {
    let alive = true;
    const q = new URLSearchParams({ url, symbol, nm, id }).toString();
    fetch('/api/vn-events/summary?' + q)
      .then((r) => r.json())
      .then((j) => { if (!alive) return; if (j.summary) { setText(j.summary); setState('done'); } else setState('error'); })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps
  if (state === 'error') return null; // 실패(resolve 안 됨) 시 조용히 숨김
  return (
    <div className="mt-1.5 rounded-lg bg-unjong-accent/5 px-2.5 py-2">
      <div className="mb-1 flex items-center gap-1">
        <Sparkles size={11} className="text-unjong-accent" />
        <span className="text-[10px] font-medium text-unjong-accent">AI 요약</span>
        <span className="ml-auto text-[10px] text-unjong-muted">원문 기반</span>
      </div>
      {state === 'loading'
        ? <p className="text-[11px] text-unjong-muted">원문 읽는 중…</p>
        : <p className="text-[12px] leading-relaxed text-unjong-primary">{text}</p>}
    </div>
  );
}
```

**(b) `VnEventLayer` 리스트에 배선** — `VnEventLayer` 안 각 `<li>`에서 `<a>...</a>` 닫힌 뒤(닫는 `</li>` 앞)에 추가:
```tsx
<VnFilingSummary url={e.url} symbol={symbol} nm={e.title} id={e.id} />
```
> STEP 657/657B에서 남겨둔 요약 슬롯 자리가 있으면 거기에. 없으면 위치만 위처럼 잡아 삽입.

---

## 3단계 — 검증 → 커밋
```bash
npx tsc --noEmit          # EXIT 0
pkill -f "next dev"; rm -rf .next && npm run dev
```
- `/stock/FPT.VN`·`VIC.VN`·`VNM.VN`에서 일부 항목 밑에 **한국어** 요약이 뜨는지 확인(전 항목 아님 — resolve 안 되는 건 숨김이 정상).
- 요약이 **영어/베트남어**로 나오면 후처리1 번역이 도는지 확인(캐시 때문에 안 바뀌면 해당 `filing_summaries` 행 삭제 후 재요청).
- `curl "http://localhost:3333/api/vn-events/summary?url=<실제 e.url>&symbol=FPT.VN&nm=test&id=<e.id>"` 직접 확인.
- **몇 %가 요약 뜨는지** 대략 세서 보고(resolve 성공률 = VN R1 실효성 지표).
- console.log 금지. 빌드 깨진 채 커밋 금지.

```bash
git add "app/api/vn-events/summary/route.ts" "app/stock/[symbol]/StockLensClient.tsx"
git commit -m "feat(vn): STEP 658 VN R1 기사 원문요약 VnFilingSummary (구글뉴스 링크 resolve→베트남어→한국어, 실패시 숨김)"
git push
```
- 배포 후: `onetrillion.app/stock/FPT.VN`에서 요약 렌더 + **Vercel서 구글뉴스 링크 resolve 되는지**(로컬과 다를 수 있음) 실측.

---

## 4단계 — 문서 마감(Cowork이 정리하되 Claude Code가 4개 날짜 오늘로)
STEP 657·657B·658 묶어 CHANGELOG 한 줄 + 4개 문서 헤더 날짜 오늘. 상세 인수인계(SESSION_BOOT·NEW_SESSION_HANDOFF·다음=CN)는 Cowork.

## Cowork에게 보고
1. 로컬 resolve 성공률(요약 뜬 항목 비율) + 한국어 출력 정상 여부(번역 폴백 탔는지).
2. **Vercel 도달성** — 프로덕션서 구글뉴스 링크 resolve 되는지(로컬만 되면 R1 실효 없음 → 대안 논의).
3. FPT/VIC/VNM 눈검수 요약 품질.
→ 다음 = **CN 공시**(cninfo·HKEXnews · ⚠️东方財富 IP차단 전례로 도달성 프로브 먼저) 또는 광고(대화 먼저).
