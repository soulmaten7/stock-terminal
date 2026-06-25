import { createAdminClient } from "./supabase/admin";

// STEP 285에서 실측 검증한 키워드/블랙리스트 (코인·부동산·골프 등 제외, 공모주 '청약'은 살림)
const KEYWORDS = ["코스피", "코스닥", "코스피200", "공모주", "배당주", "우량주", "가치주", "국내주식", "증시", "주식투자", "실적발표"];
const BLACK = /코인|비트코인|암호화폐|가상자산|알트코인|이더리움|업비트|빗썸|김치프리미엄|스테이킹|NFT|디파이|부동산|아파트|분양|골프|등산|먹방|게임/i;

function weekLabel(d: Date): string {
  const wk = Math.ceil(d.getDate() / 7);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${wk}주차`;
}

type Chan = {
  channel_id: string;
  title: string;
  thumbnail_url: string;
  subscriber_count: number;
  channel_url: string;
};

export async function refreshYoutubeTop100() {
  const KEY = process.env.YOUTUBE_API_KEY;
  if (!KEY) throw new Error("YOUTUBE_API_KEY 없음");

  // 1) 키워드별 채널 검색 → 채널 ID 수집(중복 제거)
  const ids = new Set<string>();
  for (const kw of KEYWORDS) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(kw)}&regionCode=KR&relevanceLanguage=ko&maxResults=50&key=${KEY}`;
    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json();
    if (j.error) throw new Error(`search 실패: ${j.error.message}`);
    for (const it of j.items ?? []) {
      const cid = it.snippet?.channelId ?? it.id?.channelId;
      if (cid) ids.add(cid);
    }
  }

  // 2) 구독자수/설명 조회(50개씩) + 블랙리스트·1만↑ 필터
  const idArr = [...ids];
  const chans: Chan[] = [];
  for (let i = 0; i < idArr.length; i += 50) {
    const batch = idArr.slice(i, i + 50);
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${batch.join(",")}&key=${KEY}`;
    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json();
    if (j.error) throw new Error(`channels 실패: ${j.error.message}`);
    for (const c of j.items ?? []) {
      const title: string = c.snippet?.title ?? "";
      const desc: string = (c.snippet?.description ?? "").slice(0, 200);
      if (BLACK.test(title) || BLACK.test(desc)) continue;
      const subs = Number(c.statistics?.subscriberCount ?? 0);
      if (subs < 10000) continue;
      chans.push({
        channel_id: c.id,
        title,
        thumbnail_url: c.snippet?.thumbnails?.default?.url ?? "",
        subscriber_count: subs,
        channel_url: `https://www.youtube.com/channel/${c.id}`,
      });
    }
  }

  // 3) 구독자순 정렬 → Top 100
  chans.sort((a, b) => b.subscriber_count - a.subscriber_count);
  const week = weekLabel(new Date());
  const rows = chans.slice(0, 100).map((c, i) => ({
    ...c,
    rank: i + 1,
    country: "KR",
    week_label: week,
    updated_at: new Date().toISOString(),
  }));

  // 4) 한국 채널 전체 교체 — 수집이 충분할 때만(빈/부분 수집으로 테이블 비우는 사고 방지)
  if (rows.length < 30) {
    throw new Error(`수집 채널 ${rows.length}개로 너무 적음 — 기존 데이터 보존(교체 중단)`);
  }
  const supabase = createAdminClient();
  await supabase.from("youtube_channels").delete().eq("country", "KR");
  const { error } = await supabase.from("youtube_channels").insert(rows);
  if (error) throw new Error(`DB insert 실패: ${error.message}`);

  return { count: rows.length, week, candidates: idArr.length };
}
