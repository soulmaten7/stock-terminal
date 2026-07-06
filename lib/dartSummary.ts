import { unzipSync } from 'fflate';

// R1-KR: DART 공시 원문(document.xml = zip 안의 XML) → 순수 텍스트.
// ⚠️ DART 원문 XML은 EUC-KR 인코딩 — UTF-8로 읽으면 한글이 깨진다. 선언부 보고 디코더 선택.
// 프레임워크 무관. LLM 요약은 라우트에서.

function decodeXml(bytes: Uint8Array): string {
  let enc = 'euc-kr'; // DART 원문 표준
  try {
    const head = new TextDecoder('ascii').decode(bytes.slice(0, 200)).toLowerCase();
    if (head.includes('utf-8')) enc = 'utf-8';
  } catch { /* ignore */ }
  try {
    return new TextDecoder(enc).decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes); // euc-kr 미지원 환경 폴백
  }
}

export async function fetchDartDocText(rceptNo: string, cap = 10000): Promise<string> {
  const key = process.env.DART_API_KEY;
  if (!key || !/^\d{14}$/.test(rceptNo)) return '';
  try {
    const res = await fetch(
      `https://opendart.fss.or.kr/api/document.xml?crtfc_key=${key}&rcept_no=${rceptNo}`,
      { cache: 'no-store', signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return '';
    const buf = new Uint8Array(await res.arrayBuffer());
    const files = unzipSync(buf);
    const xmlNames = Object.keys(files).filter((n) => n.toLowerCase().endsWith('.xml'));
    if (!xmlNames.length) return '';
    // 본문 = 가장 큰 xml
    const main = xmlNames.sort((a, b) => files[b].length - files[a].length)[0];
    const xml = decodeXml(files[main]);
    const text = xml
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/&#\d+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, cap);
  } catch {
    return '';
  }
}
