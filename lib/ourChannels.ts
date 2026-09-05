import { createAdminClient } from "./supabase/admin";

// EarthTicker 홈 "우리 채널" 카드 — youtube_channels(경쟁사 Top100 랭킹, refreshYoutubeTop100())와
// 무관한 별도 테이블(our_channels)에 저장한다. 채널 ID를 이미 알고 있어 lib/youtube.ts의
// search.list(키워드 발굴) 단계는 필요 없고, channels.list만 그대로 재사용한다(ORDER_트릴리언채널카드_0905).
//
// channel_key = 채널 슬러그(국가와 무관, 한 국가에 채널이 둘 이상 생길 여지 대비) ·
// country_code = lib/constants/reportCountries.ts의 국가 코드와 매칭(ORDER_트릴리언국가확장구조_0905 §2).
const OUR_CHANNELS: { channel_key: string; country_code: string; channel_id: string; channel_url: string; fallbackTitle: string }[] = [
  { channel_key: "kr", country_code: "KR", channel_id: "UC81WH6o_AKDN2NVqBSs3mlg", channel_url: "https://www.youtube.com/channel/UC81WH6o_AKDN2NVqBSs3mlg", fallbackTitle: "스톡스카우터" },
  { channel_key: "us", country_code: "US", channel_id: "UC0BirFox7u4vg2iMMwBZZ-Q", channel_url: "https://www.youtube.com/channel/UC0BirFox7u4vg2iMMwBZZ-Q", fallbackTitle: "WeTheTicker" },
];

export type OurChannelCard = {
  channel_key: string;
  country_code: string;
  title: string;
  subscriber_count: number | null; // 화면엔 안 뜨지만(ORDER_트릴리언국가확장구조_0905 §0-1(A)) 계속 쌓는다
  thumbnail_url: string | null;
  channel_url: string;
};

// 크론(app/api/cron/our-channels)이 하루 1회 호출 — YouTube Data API channels.list 한 번으로
// 두 채널 값을 같이 받아 upsert(channel_key 충돌 시 갱신)한다.
export async function refreshOurChannels() {
  const KEY = process.env.YOUTUBE_API_KEY;
  if (!KEY) throw new Error("YOUTUBE_API_KEY 없음");

  const ids = OUR_CHANNELS.map((c) => c.channel_id).join(",");
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${ids}&key=${KEY}`;
  const r = await fetch(url, { cache: "no-store" });
  const j = await r.json();
  if (j.error) throw new Error(`channels 조회 실패: ${j.error.message}`);

  const byId = new Map<string, { title: string; thumbnail_url: string; subscriber_count: number }>();
  for (const c of j.items ?? []) {
    byId.set(c.id, {
      title: c.snippet?.title ?? "",
      thumbnail_url: c.snippet?.thumbnails?.default?.url ?? "",
      subscriber_count: Number(c.statistics?.subscriberCount ?? 0),
    });
  }

  const supabase = createAdminClient();
  const results: { channel_key: string; title: string; subscriber_count: number }[] = [];
  for (const meta of OUR_CHANNELS) {
    const info = byId.get(meta.channel_id);
    if (!info) continue; // API가 이 채널을 못 찾음(정지·ID 오타 등) — 기존 행 보존, 덮어쓰지 않음
    const { error } = await supabase.from("our_channels").upsert(
      {
        channel_key: meta.channel_key,
        country_code: meta.country_code,
        channel_id: meta.channel_id,
        title: info.title,
        subscriber_count: info.subscriber_count,
        thumbnail_url: info.thumbnail_url,
        channel_url: meta.channel_url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "channel_key" }
    );
    if (error) throw new Error(`DB upsert 실패(${meta.channel_key}): ${error.message}`);
    results.push({ channel_key: meta.channel_key, title: info.title, subscriber_count: info.subscriber_count });
  }
  return { updated: results.length, channels: results };
}

// 홈 서버 프리페치용 읽기 — DB 행이 아직 없거나(첫 크론 전) 조회 자체가 실패해도 카드는
// 항상 뜨게 한다(ORDER 명시: 구독자수만 생략, 채널명·링크는 상수라 뜬다).
export async function getOurChannels(): Promise<OurChannelCard[]> {
  const fallback = (key: string): OurChannelCard => {
    const meta = OUR_CHANNELS.find((c) => c.channel_key === key)!;
    return { channel_key: key, country_code: meta.country_code, title: meta.fallbackTitle, subscriber_count: null, thumbnail_url: null, channel_url: meta.channel_url };
  };
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("our_channels")
      .select("channel_key, country_code, title, subscriber_count, thumbnail_url, channel_url");
    const byKey = new Map((data ?? []).map((row) => [row.channel_key, row]));
    return OUR_CHANNELS.map((meta) => {
      const row = byKey.get(meta.channel_key);
      return row
        ? {
            channel_key: meta.channel_key,
            country_code: row.country_code,
            title: row.title,
            subscriber_count: row.subscriber_count,
            thumbnail_url: row.thumbnail_url,
            channel_url: row.channel_url,
          }
        : fallback(meta.channel_key);
    });
  } catch {
    return OUR_CHANNELS.map((meta) => fallback(meta.channel_key));
  }
}
