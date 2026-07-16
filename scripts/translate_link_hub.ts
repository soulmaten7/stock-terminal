import { createAdminClient } from "../lib/supabase/admin";

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error("OPENAI_API_KEY 없음 (.env.local 확인)"); process.exit(1); }

const SYSTEM = `You translate short Korean UI labels that describe finance/investing websites into concise English.
Rules:
- Keep it a terse LABEL (a few words), same meaning. No full sentences, no added marketing.
- Preserve parenthetical tags: (유료)->(paid), (무료)->(free), keep (SRO), (API) etc.
- Keep proper nouns / product & feature names as-is (e.g. Snowflake, ETF, API, MLP).
- Match the source's terse register. No trailing period.
Return ONLY a JSON array of English strings, same order and same length as the input array.`;

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
  const { data: rows, error } = await sb
    .from("link_hub")
    .select("id, description")
    .is("description_en", null)
    .not("description", "is", null);
  if (error) { console.error(error); process.exit(1); }
  const list = (rows ?? []) as { id: number; description: string }[];
  console.log(`번역 대상(description_en NULL): ${list.length}건`);
  const BATCH = 30;
  let done = 0;
  for (let i = 0; i < list.length; i += BATCH) {
    const chunk = list.slice(i, i + BATCH);
    let en: string[];
    try { en = await translateBatch(chunk.map((r) => r.description)); }
    catch (e) { console.error(`배치 ${i} 실패, 건너뜀:`, String(e)); continue; }
    for (let k = 0; k < chunk.length; k++) {
      const { error: ue } = await sb.from("link_hub").update({ description_en: en[k] }).eq("id", chunk[k].id);
      if (ue) console.error(`update id=${chunk[k].id} 실패`, ue); else done++;
    }
    console.log(`  ${Math.min(i + BATCH, list.length)}/${list.length}`);
    await new Promise((r) => setTimeout(r, 500));
  }
  const { count } = await sb.from("link_hub").select("*", { count: "exact", head: true }).is("description_en", null);
  console.log(`완료: ${done}건 번역·업데이트. 남은 NULL: ${count ?? "?"}`);
}
main();
