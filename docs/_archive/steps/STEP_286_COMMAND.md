<!-- 2026-06-20 -->
# STEP 286 — [V7 ③] 유튜브 Top100 주간 자동갱신 (Vercel Cron)

## ⚠️ 먼저 — 딱 한 번 수동 (Vercel 환경변수)

배포된 서버가 유튜브 API 키를 알아야 크론이 돈다. **지금은 로컬 `.env.local`에만 있음.**

1. https://vercel.com → **unjong**(stock-terminal) 프로젝트 → **Settings** → **Environment Variables**
2. **Add New**:
   - Key: `YOUTUBE_API_KEY`
   - Value: (로컬 `.env.local`에 넣은 그 키 값 그대로)
   - Environment: **Production** 체크
3. **Save**

> `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`는 이미 Vercel에 있음(기존 fss 크론·앱이 쓰는 중) → 추가 안 해도 됨.

이거 안 하면 크론이 401/no-key로 실패함. **이 작업 먼저.**

---

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_286_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 285(`2e9a915`). 빌드 ✓.
- **패턴 근거**: 기존 `app/api/cron/fss-advisors/route.ts` + `lib/fss.ts` 구조 그대로 따름.

---

## 🎯 목표

매주 **월요일 09:00(KST)** 자동으로 한국 주식 유튜브를 다시 검색→필터→구독자순 Top100으로 교체.
- 검색 로직 = STEP 285 적재 때 실측 검증한 것과 동일(11개 키워드, 코인·부동산·골프 블랙리스트, 1만↑).
- 보호 = `CRON_SECRET`(기존 크론과 동일 방식, Vercel이 자동으로 인증 헤더 추가).

> 신규 파일 2개 + `vercel.json` 1줄 추가.

---

## 📄 파일 1 (신규 생성) — `lib/youtube.ts`

```ts
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

  // 4) 한국 채널 전체 교체(delete → insert)
  const supabase = createAdminClient();
  await supabase.from("youtube_channels").delete().eq("country", "KR");
  const { error } = await supabase.from("youtube_channels").insert(rows);
  if (error) throw new Error(`DB insert 실패: ${error.message}`);

  return { count: rows.length, week, candidates: idArr.length };
}
```

---

## 📄 파일 2 (신규 생성) — `app/api/cron/youtube-refresh/route.ts`

> 기존 `fss-advisors/route.ts`와 동일한 보호 패턴.

```ts
import { NextResponse } from "next/server";
import { refreshYoutubeTop100 } from "@/lib/youtube";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const r = await refreshYoutubeTop100();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
```

---

## 📄 파일 3 — `vercel.json` (크론 1줄 추가)

**찾기:**
```json
{
  "crons": [
    { "path": "/api/cron/fss-advisors", "schedule": "0 19 * * *" }
  ]
}
```
**바꾸기:**
```json
{
  "crons": [
    { "path": "/api/cron/fss-advisors", "schedule": "0 19 * * *" },
    { "path": "/api/cron/youtube-refresh", "schedule": "0 0 * * 1" }
  ]
}
```

> `0 0 * * 1` = 매주 월요일 00:00 UTC = **월요일 09:00 한국시간**.

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러 (`/api/cron/youtube-refresh` 라우트가 빌드 목록에 잡히는지).

> 로컬에선 크론이 안 돈다(정상). 실제 갱신은 배포된 Vercel에서 매주 월요일 자동.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 유튜브 Top100 주간 자동갱신 크론 (월요일 09시 KST, lib/youtube + cron route) (V7 ③, STEP 286)" && git push
```

푸시하면 Vercel이 자동 배포 → 크론 등록됨.

---

## 🧪 (선택) 지금 바로 한 번 테스트

다음 월요일까지 안 기다리고 작동을 확인하려면:
- Vercel 대시보드 → 프로젝트 → **Cron Jobs** 탭 → `youtube-refresh` 옆 **Run** 버튼 클릭
- 성공하면 `{ ok: true, count: 100, week: "...", candidates: ... }` 반환
- (실패 시 대부분 원인: 위 ⚠️ `YOUTUBE_API_KEY` Vercel 추가 안 함)

> 데이터는 이미 이번 주 것으로 채워져 있으니, 테스트 안 해도 다음 월요일에 자동 갱신됨.

---

> **한 줄 요약**: 매주 월요일 09시(KST) Vercel Cron이 `/api/cron/youtube-refresh`를 호출 → `lib/youtube.ts`가 검색·필터·Top100 교체. `CRON_SECRET`은 기존 것 재사용, `YOUTUBE_API_KEY`만 Vercel에 한 번 추가하면 끝.
