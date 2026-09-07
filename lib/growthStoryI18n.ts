// channel_growth_stories 로케일 표시 — 2026-09-07(채팅 지시). channelReportI18n.ts와 같은 원칙,
// 다만 이 유형은 broker/verdict 같은 채널 고정 어휘가 없어 자유서술 4파트(intro·challenge·
// response·summary)만 다룬다. stock_name은 이 라우트가 애초에 안 내려준다(channel-reports와
// 동일 원칙 — symbol 하나로 화면이 이미 이름을 안다).
import { createAdminClient } from "./supabase/admin";

export type GrowthStoryTranslation = {
  story_id: number;
  intro: string | null;
  challenge: string | null;
  response: string | null;
  summary: string | null;
  status: string;
};

export async function fetchGrowthStoryLocaleData(params: {
  storyId: number | null;
  loc: "ko" | "en";
}): Promise<GrowthStoryTranslation | null> {
  if (!params.storyId) return null;
  const sb = createAdminClient();
  const { data } = await sb
    .from("channel_growth_story_translations")
    .select("story_id, intro, challenge, response, summary, status")
    .eq("story_id", params.storyId)
    .eq("target_lang", params.loc)
    .maybeSingle();
  return (data as GrowthStoryTranslation | null) ?? null;
}
