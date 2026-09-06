// R1: 8-K 원문(본문 + 핵심 첨부 EX-99.x) → 순수 텍스트 추출. LLM 요약은 라우트에서.
// 원칙: LLM은 '읽어서 사실만'. 여기선 텍스트만 뽑아 준다(예측·판정 로직 없음).
// SEC는 User-Agent 필수(없으면 403). 프레임워크 무관(next/server import 금지).

const SEC_UA = process.env.SEC_USER_AGENT || "EarthTicker/1.0 (signal.kr.biz@gmail.com)";

// HTML → 순수 텍스트(태그·스크립트·엔티티 제거·공백 정리). SEC 공시는 비교적 깨끗한 HTML.
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchText(url: string): Promise<string> {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": SEC_UA }, cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return "";
    return stripHtml(await r.text());
  } catch { return ""; }
}

// 파일 디렉토리 리스팅에서 문서 파일명 목록(index 제외).
async function fetchDir(base: string): Promise<string[]> {
  try {
    const r = await fetch(base, {
      headers: { "User-Agent": SEC_UA }, cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return [];
    const html = await r.text();
    const names = new Set<string>();
    for (const m of html.matchAll(/href="([^"]+\.html?)"/gi)) {
      const n = (m[1].split("/").pop() || "").trim();
      if (n && !/index/i.test(n)) names.add(n);
    }
    return [...names];
  } catch { return []; }
}

// 원문 텍스트 = primaryDocument + (필요 시) EX-99.x 첨부. cap으로 토큰 바운드.
// 2.02 실적처럼 본문이 껍데기(짧거나 exhibit 참조)면 보도자료(EX-99.x)까지 읽어야 실제 내용이 잡힘.
export async function fetchFilingText(
  cikNum: number, acc: string, primaryDoc: string, cap = 10000,
): Promise<string> {
  const base = `https://www.sec.gov/Archives/edgar/data/${cikNum}/${acc}/`;
  let text = primaryDoc ? await fetchText(base + primaryDoc) : "";

  const looksShell = text.length < 1500 || /(exhibit\s*99|press\s*release|99\.1)/i.test(text);
  if (looksShell) {
    const files = await fetchDir(base);
    for (const f of files) {
      if (!/ex-?99/i.test(f)) continue;            // 보도자료·실적표 등 핵심 첨부만
      const t = await fetchText(base + f);
      if (t) text += (text ? "\n\n" : "") + t;
      if (text.length > cap) break;
    }
  }
  return text.slice(0, cap);
}
