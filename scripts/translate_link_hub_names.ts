import { createAdminClient } from "../lib/supabase/admin";

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error("OPENAI_API_KEY 없음"); process.exit(1); }

const SYSTEM = `You translate the NAMES of Korean or mixed finance/investing websites into English, for an English-locale link directory. Return proper-noun style NAMES, not descriptions.
Rules:
- Well-known institutions/exchanges/agencies: use the OFFICIAL English name. Examples: 금융감독원→Financial Supervisory Service; 금융위원회→Financial Services Commission; 한국은행 ECOS→Bank of Korea ECOS; 한국거래소(KRX)→Korea Exchange (KRX); DART 전자공시시스템→DART Electronic Disclosure; 한국예탁결제원→Korea Securities Depository; 금융투자협회→KOFIA; 통계청 KOSIS→Statistics Korea KOSIS; 기획재정부→Ministry of Economy and Finance; 코스닥협회→KOSDAQ Association.
- "English brand + Korean descriptor": keep the brand, translate only the Korean tail. Examples: Investing.com 배당캘린더→Investing.com Dividend Calendar; Yahoo Finance ETF 스크리너→Yahoo Finance ETF Screener; U.S. Treasury 금리→U.S. Treasury Rates; FOMC 일정·점도표→FOMC Schedule & Dot Plot; EDGAR 전문검색→EDGAR Full-Text Search; U. Michigan 소비자심리→U. Michigan Consumer Sentiment; ADB 베트남→ADB Vietnam; World Bank 베트남→World Bank Vietnam.
- Korean brokerages "X증권 리서치": use the firm's standard English name + Research. Examples: 삼성증권→Samsung Securities; 미래에셋증권→Mirae Asset Securities; NH투자증권→NH Investment & Securities; 한국투자증권→Korea Investment & Securities; KB증권→KB Securities; 키움증권→Kiwoom Securities; 신한투자증권→Shinhan Securities; 하나증권→Hana Securities; 대신증권→Daishin Securities; 메리츠증권→Meritz Securities.
- Korean media/portals: the outlet's common English name or a clean romanization. Examples: 매일경제→Maeil Business; 한국경제→Korea Economic Daily; 서울경제→Seoul Economic Daily; 네이버 증권 뉴스→Naver Securities News; 네이버페이 증권→Naver Pay Securities; 다음 금융→Daum Finance; 연합뉴스 경제→Yonhap News Economy; 이데일리→Edaily; 머니투데이→Money Today.
- Exchanges' disclosure/listing pages (HOSE 공시, HNX 경매·IPO): translate naturally → Ho Chi Minh Exchange Disclosures, HNX Auctions & IPO.
- Concise, proper-noun style. No trailing period. If unsure, transliterate sensibly.
Return ONLY a JSON array of English names, same order and length as input.`;

async function translateBatch(items: string[]): Promise<string[]> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: JSON.stringify(items) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const j: any = await res.json();
  const raw = (j?.choices?.[0]?.message?.content ?? "[]").replace(/^```json\s*|\s*```$/g, "").trim();
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr) || arr.length !== items.length) throw new Error(`길이 불일치 ${arr?.length} vs ${items.length}`);
  return arr.map((x) => String(x).trim());
}

async function main() {
  const sb = createAdminClient();
  // site_name에 한글 포함 & 아직 미번역
  const { data, error } = await sb.from("link_hub").select("id, site_name").is("site_name_en", null);
  if (error) { console.error(error); process.exit(1); }
  const list = ((data ?? []) as { id: number; site_name: string }[]).filter((r) => /[가-힣]/.test(r.site_name || ""));
  console.log(`번역 대상(한글 site_name·site_name_en NULL): ${list.length}건`);
  const BATCH = 25;
  let done = 0;
  for (let i = 0; i < list.length; i += BATCH) {
    const chunk = list.slice(i, i + BATCH);
    let en: string[];
    try { en = await translateBatch(chunk.map((r) => r.site_name)); }
    catch (e) { console.error(`배치 ${i} 실패, 건너뜀:`, String(e)); continue; }
    for (let k = 0; k < chunk.length; k++) {
      const { error: ue } = await sb.from("link_hub").update({ site_name_en: en[k] }).eq("id", chunk[k].id);
      if (ue) console.error(`update id=${chunk[k].id} 실패`, ue); else done++;
    }
    console.log(`  ${Math.min(i + BATCH, list.length)}/${list.length}`);
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(`완료: ${done}건 번역·업데이트.`);
}
main();
