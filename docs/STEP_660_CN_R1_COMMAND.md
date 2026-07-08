<!-- 2026-07-08 (2nd) -->
# STEP 660 — 🇨🇳 CN R1 원문요약 (`CnFilingSummary` · cninfo PDF)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** STEP 659 커밋됨(HEAD `f3fee9b`) — CnEventLayer 라이브(cninfo A주 공시 8건·`e.pdf`에 정적 PDF URL). 로컬 프로브 통과.
**목표:** CN 각 공시 아래에 **PDF 원문(중국어) → 한국어 사실 요약**(`CnFilingSummary`). → 공식 공시 R1 = US·KR·JP·GB·**CN 5개국**.
**패턴:** `app/api/jp-events/summary/route.ts`(원문 다운로드→텍스트 추출→한국어 요약) + `JpFilingSummary` 미러. **차이 = 원문이 PDF**(JP는 CSV) → `unpdf`로 텍스트 추출.

> ⚠️ **미해결 2개를 이번에 같이 실측**: (1) **Vercel 도달성**(cninfo가 프로덕션서 되는지·东方財富 IP차단 전례) (2) **PDF가 텍스트인가 스캔인가**(스캔이면 추출 0 → 숨김). 배포 후 확인.

---

## 1단계 — PDF 텍스트 추출 라이브러리 설치
서버리스(Vercel)에서 동작하는 순수 JS PDF 추출기 `unpdf`(pdfjs 기반·네이티브 의존성 없음) 사용:
```bash
npm i unpdf
```

## 2단계 — `app/api/cn-events/summary/route.ts` 생성

```ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractText, getDocumentProxy } from "unpdf";

export const runtime = "nodejs";
export const maxDuration = 60;

// R1-CN: cninfo 공시 PDF(중국어) → 한국어 '사실' 요약. US/KR/JP/GB R1의 CN 짝.
// 전역 캐시(filing_summaries, accession='CN'+id). 예측·판정 금지. 원문=증감회 지정 공식 공시(공개).
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";

export async function GET(req: NextRequest) {
  const pdf = (req.nextUrl.searchParams.get("pdf") || "").trim();
  const symbol = (req.nextUrl.searchParams.get("symbol") || "").trim();
  const nm = req.nextUrl.searchParams.get("nm") || "";
  const id = (req.nextUrl.searchParams.get("id") || "").trim();
  // SSRF 방지 — cninfo 정적 PDF만 허용.
  if (!/^https?:\/\/static\.cninfo\.com\.cn\/.+\.PDF$/i.test(pdf) || !id) {
    return NextResponse.json({ error: "bad url" }, { status: 400 });
  }
  const acc = "CN" + id;

  const sb = createAdminClient();
  const { data: hit } = await sb.from("filing_summaries").select("summary_ko").eq("accession", acc).maybeSingle();
  if (hit?.summary_ko) return NextResponse.json({ summary: hit.summary_ko, cached: true });

  // PDF 다운로드 → 텍스트 추출
  let text = "";
  try {
    const res = await fetch(pdf, { headers: { "User-Agent": UA, Referer: "http://www.cninfo.com.cn/" }, cache: "no-store", signal: AbortSignal.timeout(20000) });
    if (res.ok) {
      const buf = new Uint8Array(await res.arrayBuffer());
      const doc = await getDocumentProxy(buf);
      const { text: t } = await extractText(doc, { mergePages: true });
      text = (t || "").replace(/\s+/g, " ").trim().slice(0, 12000);
    }
  } catch { /* graceful */ }
  // 텍스트 너무 짧으면 = 스캔 PDF or 추출 실패 → 숨김
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
            "당신은 중국 상장사 공시(중국어)를 한국 개인투자자에게 사실만 전달하는 애널리스트입니다. 공시에 실제로 쓰인 내용만 2~3문장 한국어로 요약합니다. 규칙: (1) 예측·전망·투자 추천(사라/팔아라·목표가) 절대 금지 (2) 공시에 없는 내용 추가 금지 (3) \"무슨 일이 일어났는지\" 사실만(금액·비율·일정 등) (4) 숫자·통화(위안 元)는 원문 그대로 (5) 반드시 한국어로, 해요체·군더더기 없이. 영어·중국어로 답하지 마세요.",
        },
        { role: "user", content: `중국 공시(${nm || "제목없음"}) 원문(중국어)입니다. 무슨 일이 일어났는지 한국어로 2~3문장 사실 요약:\n\n${text}` },
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

  // 후처리1: 한국어 아니면 번역(중국어 출력 방어·JP/VN 전례)
  if (!/[가-힣]/.test(summary)) {
    try {
      const tr = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model: "gpt-4o-mini", messages: [
          { role: "system", content: "다음을 자연스러운 한국어(해요체)로 옮깁니다. 내용 추가·의견 금지, 사실만." },
          { role: "user", content: summary }], max_tokens: 320, temperature: 0.2 }),
        signal: AbortSignal.timeout(20000),
      });
      if (tr.ok) { const t = (((await tr.json()).choices?.[0]?.message?.content) || "").trim(); if (/[가-힣]/.test(t)) summary = t; }
    } catch { /* 유지 */ }
  }
  // 후처리2: 통화 교정 — 중국 위안(숫자 뒤 '원'→'위안'). news-brief와 동일 결정론.
  summary = summary.replace(/(\d[\d,.]*\s*[조억만천]?\s*)원/g, "$1위안");

  await sb.from("filing_summaries").upsert(
    { accession: acc, symbol, summary_ko: summary, model: "gpt-4o-mini" },
    { onConflict: "accession" },
  );
  return NextResponse.json({ summary, cached: false });
}
```

---

## 3단계 — `StockLensClient.tsx`: `CnFilingSummary` + 배선

**(a) `CnFilingSummary`** — `JpFilingSummary`/`GbFilingSummary` 복제, 엔드포인트·파라미터만:
```tsx
function CnFilingSummary({ pdf, symbol, nm, id }: { pdf: string; symbol: string; nm: string; id: string }) {
  const [text, setText] = useState('');
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  useEffect(() => {
    let alive = true;
    if (!pdf) { setState('error'); return; }
    const q = new URLSearchParams({ pdf, symbol, nm, id }).toString();
    fetch('/api/cn-events/summary?' + q)
      .then((r) => r.json())
      .then((j) => { if (!alive) return; if (j.summary) { setText(j.summary); setState('done'); } else setState('error'); })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [pdf]); // eslint-disable-line react-hooks/exhaustive-deps
  if (state === 'error') return null; // 실패(스캔PDF·추출불가) 시 조용히 숨김
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

**(b) `CnEventLayer` 배선** — STEP 659에서 남긴 슬롯(`</a>` 뒤·`</li>` 앞)에:
```tsx
<CnFilingSummary pdf={e.pdf} symbol={symbol} nm={e.title} id={e.id} />
```

---

## 4단계 — 검증 → 커밋
```bash
npx tsc --noEmit          # EXIT 0
pkill -f "next dev"; rm -rf .next && npm run dev
```
- 로컬: `/stock/000651.SZ`(格力电器)·`600519.SS`(贵州茅台)·`002594.SZ`(比亚迪) 공시 밑 **한국어** 요약 확인.
  - `curl "http://localhost:3333/api/cn-events/summary?pdf=<실제 e.pdf>&symbol=000651.SZ&nm=test&id=<e.id>"` 직접 확인.
  - **스캔 PDF면 숨김이 정상**(텍스트 추출 0). 몇 %가 요약 뜨는지 세서 보고.
  - 중국어로 나오면 후처리1 번역 확인(캐시면 해당 `filing_summaries` 행 삭제 후 재요청).
- console.log 금지. 빌드 깨진 채 커밋 금지.
```bash
git add app/api/cn-events/summary/route.ts "app/stock/[symbol]/StockLensClient.tsx" package.json package-lock.json
git commit -m "feat(cn): STEP 660 CN R1 공시 PDF 원문요약 CnFilingSummary (unpdf 텍스트추출→중국어→한국어·filing_summaries CN+id, 공식 공시 R1 5개국)"
git push
```
- **배포 후 필수 실측**(가장 중요): `curl "https://onetrillion.app/api/cn-events?symbol=000651.SZ"` → events 있는지(**cninfo Vercel 도달성**) + `/stock/000651.SZ`에서 요약 렌더(**static.cninfo.com.cn PDF가 Vercel서 받아지는지**). 막히면 헤더 조정 or Cowork 보고.

---

## 5단계 — 문서 마감(Claude Code가 4개 날짜만 오늘로)
STEP 659·660 묶어 CHANGELOG 한 줄 + 4개 문서 헤더 날짜 오늘. 상세 인수인계(SESSION_BOOT·NEW_SESSION_HANDOFF·다음=CN HK STEP 661)는 Cowork.

## Cowork에게 보고
1. 로컬 요약 성공률(텍스트 PDF 비율) + 한국어 출력 정상 여부(번역 폴백 탔는지).
2. **Vercel 도달성** — cninfo 목록 + static PDF 둘 다 프로덕션서 되는지(로컬만 되면 R1 실효 없음 → 东方財富식 차단이면 대안 논의).
3. 格力/茅台/比亚迪 눈검수 요약 품질.
→ 다음 = **STEP 661 CN HK 공시(HKEXnews·`.HK`)** → CN 완결 후 광고(대화 먼저).
