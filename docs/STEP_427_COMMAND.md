<!-- 2026-06-27 -->
# STEP 427 — 유튜브 행에 '채널 소개' 한 줄 (원본 설명 가볍게 정리, AI 없음)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_427_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
유튜브 Top100 행이 휑하다 → **채널 본인이 쓴 소개(description)를 가볍게 정리해 채널명 아래 한 줄**로 표시. **AI·분류 없음**(채널 자기소개라 엇나갈 일 없음, 최악이 '빈칸'). 주간 크론이 매주 자동 정리·저장.
- 정리 규칙: 첫 의미있는 줄 → 홍보·연락처(이메일·URL·문의·멤버십) 줄 스킵 → 이모지 제거 → ~40자. 깔끔한 줄 없으면 **빈칸**.

## 전제
- 최신 main(STEP 426 이후, 미배포 로컬). **DB 컬럼 `youtube_channels.description text`는 Cowork이 Supabase MCP로 이미 추가함 — 추가 작업 X.**
- **커밋 보류**(테스트 — 보고 별로면 되돌림). dev 서버 끄지 말 것.
- 변경: `lib/youtube.ts`(크론·서버) + `app/page.tsx`(서버, 새로고침 반영) + `components/toolbox/YoutubeRanking.tsx`(HMR).

---

## (1) `lib/youtube.ts` — 정리 함수 + 저장

### A. `cleanDesc` 함수 추가 (`weekLabel` 함수 바로 아래)
**찾기:**
```ts
function weekLabel(d: Date): string {
  const wk = Math.ceil(d.getDate() / 7);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${wk}주차`;
}
```
**바꾸기:**
```ts
function weekLabel(d: Date): string {
  const wk = Math.ceil(d.getDate() / 7);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${wk}주차`;
}

// 채널 자기소개를 가볍게 정리(AI 아님): 첫 의미있는 줄 → 홍보·연락처 줄 스킵 → 이모지 제거 → ~40자. 깔끔한 줄 없으면 빈칸.
function cleanDesc(raw: string): string {
  const lines = (raw || "").replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  let line = "";
  for (const l of lines) {
    if (/https?:\/\/|www\.|@|\b(문의|협찬|구독|좋아요|알림설정|멤버십|이메일|e-?mail|contact|business|inquiry)\b/i.test(l)) continue;
    line = l;
    break;
  }
  line = line.replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim();
  return line.length > 40 ? line.slice(0, 40).trim() + "…" : line;
}
```

### B. `Chan` 타입에 `description` 추가
**찾기:**
```ts
type Chan = {
  channel_id: string;
  title: string;
  thumbnail_url: string;
  subscriber_count: number;
  channel_url: string;
};
```
**바꾸기:**
```ts
type Chan = {
  channel_id: string;
  title: string;
  thumbnail_url: string;
  subscriber_count: number;
  channel_url: string;
  description: string;
};
```

### C. 저장 시 정리된 소개 포함 (원본 전체를 정리)
**찾기:**
```ts
      chans.push({
        channel_id: c.id,
        title,
        thumbnail_url: c.snippet?.thumbnails?.default?.url ?? "",
        subscriber_count: subs,
        channel_url: `https://www.youtube.com/channel/${c.id}`,
      });
```
**바꾸기:**
```ts
      chans.push({
        channel_id: c.id,
        title,
        thumbnail_url: c.snippet?.thumbnails?.default?.url ?? "",
        subscriber_count: subs,
        channel_url: `https://www.youtube.com/channel/${c.id}`,
        description: cleanDesc(c.snippet?.description ?? ""),
      });
```

## (2) `app/page.tsx` — select에 description 추가
**찾기:**
```tsx
    .select("rank, title, thumbnail_url, subscriber_count, channel_url, week_label")
    .eq("country", "KR")
```
**바꾸기:**
```tsx
    .select("rank, title, thumbnail_url, subscriber_count, channel_url, week_label, description")
    .eq("country", "KR")
```

## (3) `components/toolbox/YoutubeRanking.tsx` — 타입 + 표시

### A. 타입
**찾기:**
```ts
export type YtChannel = {
  rank: number;
  title: string;
  thumbnail_url: string | null;
  subscriber_count: number;
  channel_url: string;
  week_label: string | null;
};
```
**바꾸기:**
```ts
export type YtChannel = {
  rank: number;
  title: string;
  thumbnail_url: string | null;
  subscriber_count: number;
  channel_url: string;
  week_label: string | null;
  description?: string | null;
};
```

### B. ListRow에 subtitle(채널명 아래 한 줄)
**찾기:**
```tsx
          <ListRow
            key={c.rank}
            href={c.channel_url}
            rank={c.rank}
            iconUrl={c.thumbnail_url}
            iconRound
            title={c.title}
            stat={fmtSubs(c.subscriber_count)}
          />
```
**바꾸기:**
```tsx
          <ListRow
            key={c.rank}
            href={c.channel_url}
            rank={c.rank}
            iconUrl={c.thumbnail_url}
            iconRound
            title={c.title}
            subtitle={c.description || undefined}
            stat={fmtSubs(c.subscriber_count)}
          />
```

## (4) 기존 100개 채널에 소개 채우기 (일회성 갱신)

> 기존 행들은 description이 비어있음 → 갱신 한 번 돌려 채운다. `@next/env`로 `.env.local`을 Next처럼 읽음(추가 설치 불필요).

**새 파일 `scripts/refresh-yt.ts`:**
```ts
// 일회성: 유튜브 Top100 재수집(+정리된 description 저장). 실행: npx tsx scripts/refresh-yt.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { refreshYoutubeTop100 } = await import("../lib/youtube");
  const r = await refreshYoutubeTop100();
  console.log("✅ 유튜브 갱신:", r);
}
main().then(() => process.exit(0)).catch((e) => { console.error("❌ 실패:", e); process.exit(1); });
```

**실행:**
```bash
npx tsx scripts/refresh-yt.ts
```
- 성공하면 `✅ 유튜브 갱신: { count: 100, ... }` 출력. (YOUTUBE_API_KEY·Supabase 키는 `.env.local`에서 자동 로드.)
- 만약 `YOUTUBE_API_KEY 없음`/쿼터 에러가 나면 보고만 — 코드는 그대로 두고 **다음 주간 크론** 때 자동으로 채워짐.

## 확인 (localhost, 커밋 X)
- 유튜브 탭 → 각 채널 **이름 아래 회색 한 줄 소개**(예: "경제·시사를 쉽게 풀어주는 채널"). 일부는 빈칸일 수 있음(정상 — 깔끔한 줄 없으면 비움).
- 구독자수·랭킹·바로가기는 그대로.
- 별로면 되돌리기 쉬움(이 STEP 변경만 reset). **보고 피드백 주면 다듬거나 커밋.**
