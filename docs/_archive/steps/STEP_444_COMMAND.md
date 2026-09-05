<!-- 2026-06-28 -->
# STEP 444 — 미리보기 순서 변경 + OG 인코딩(EUC-KR) 버그 수정

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_444_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
1. **미리보기 순서 변경** — 리딩방명을 헤더에서 빼서 **정보(대표/주소/신고기간) 아래 줄**로 내리고, 그 줄 **오른쪽에 신고**(좌=리딩방명, 우=🚨 신고 N).
2. **🐛 OG 인코딩 버그 수정** — 네이버 카페 등 **EUC-KR** 페이지를 UTF-8로 읽어 제목이 깨지던 것 → charset 감지 후 올바로 디코딩 + 깨진 글자(치환문자) 버림.

## 전제
- 최신 main. 파일 2개: `components/toolbox/AdvisorDirectory.tsx`(미리보기, HMR) + `app/api/link-preview/route.ts`(라우트, **재시작**).
- **새 API 라우트 로직 변경 → 클린 재시작 필요.**

---

## (1) `components/toolbox/AdvisorDirectory.tsx` — 2곳

### (1-a) 미리보기 헤더 — 리딩방명 제거(업체명 + ⭐만)
**찾기:**
```tsx
      <div className="mb-2 flex items-start gap-2">
        {ic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ic} alt="" width={20} height={20} className="mt-0.5 h-5 w-5 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
        ) : <Globe size={18} className="mt-0.5 text-unjong-muted" />}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-unjong-primary">{isFss ? a.company_name : roomName}</h3>
          {isFss && a.info_name && a.info_name.trim() && a.info_name !== a.company_name ? (
            <p className="truncate text-[11px] text-unjong-muted">{a.info_name}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggleFav}
          aria-label={isFav ? '즐겨찾기 해제' : '즐겨찾기'}
          className={`mt-0.5 shrink-0 transition-colors ${isFav ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
        >
          <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>
```
**바꾸기:**
```tsx
      <div className="mb-2 flex items-center gap-2">
        {ic ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ic} alt="" width={20} height={20} className="h-5 w-5 rounded" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
        ) : <Globe size={18} className="text-unjong-muted" />}
        <h3 className="min-w-0 flex-1 truncate text-sm font-bold text-unjong-primary">{isFss ? a.company_name : roomName}</h3>
        <button
          type="button"
          onClick={onToggleFav}
          aria-label={isFav ? '즐겨찾기 해제' : '즐겨찾기'}
          className={`shrink-0 transition-colors ${isFav ? 'text-unjong-accent' : 'text-unjong-border hover:text-unjong-accent'}`}
        >
          <Star size={18} fill={isFav ? 'currentColor' : 'none'} />
        </button>
      </div>
```

### (1-b) 신고 줄 → 리딩방명(좌) + 신고(우)
**찾기:**
```tsx
      <div className="mt-3 flex items-center gap-3 text-xs">
        <button type="button" onClick={onReport} className="flex items-center gap-1 text-unjong-muted hover:text-red-500">
          <Siren size={13} /> 신고 {a.report_count}
        </button>
      </div>
```
**바꾸기:**
```tsx
      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        {isFss && a.info_name && a.info_name.trim() && a.info_name !== a.company_name ? (
          <span className="min-w-0 truncate text-unjong-muted">{a.info_name}</span>
        ) : <span />}
        <button type="button" onClick={onReport} className="flex shrink-0 items-center gap-1 text-unjong-muted hover:text-red-500">
          <Siren size={13} /> 신고 {a.report_count}
        </button>
      </div>
```

---

## (2) `app/api/link-preview/route.ts` — EUC-KR 디코딩

**찾기:**
```ts
    const ctype = res.headers.get("content-type") ?? "";
    if (res.ok && ctype.includes("text/html")) {
      const html = (await res.text()).slice(0, 600000);
      title = metaOf(html, "og:title") || (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null);
      if (title) title = decodeEntities(title).trim().slice(0, 200) || null;
      image = metaOf(html, "og:image");
      description = metaOf(html, "og:description") || metaOf(html, "description");
      if (description) description = description.slice(0, 300);
      siteName = metaOf(html, "og:site_name");
      if (image || title) status = "ok";
    } else {
      status = "error";
    }
```
**바꾸기:**
```ts
    const ctype = res.headers.get("content-type") ?? "";
    if (res.ok && ctype.includes("text/html")) {
      const buf = await res.arrayBuffer();
      // charset 감지: content-type → 없으면 <meta charset>
      let charset = (ctype.match(/charset=["']?([\w-]+)/i)?.[1] ?? "").toLowerCase();
      if (!charset) {
        const head = new TextDecoder("latin1").decode(buf.slice(0, 4096));
        charset = (head.match(/charset=["']?([\w-]+)/i)?.[1] ?? "utf-8").toLowerCase();
      }
      const isKr = /euc-?kr|ks_c|cp949|949/.test(charset);
      let html: string;
      try {
        html = new TextDecoder(isKr ? "euc-kr" : "utf-8").decode(buf);
      } catch {
        html = new TextDecoder("utf-8").decode(buf);
      }
      html = html.slice(0, 600000);
      title = metaOf(html, "og:title") || (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null);
      if (title) title = decodeEntities(title).trim().slice(0, 200) || null;
      image = metaOf(html, "og:image");
      description = metaOf(html, "og:description") || metaOf(html, "description");
      if (description) description = decodeEntities(description).slice(0, 300);
      siteName = metaOf(html, "og:site_name");
      // 깨진 글자(치환문자 �)는 버림
      if (title && title.includes("�")) title = null;
      if (description && description.includes("�")) description = null;
      if (siteName && siteName.includes("�")) siteName = null;
      if (image || title) status = "ok";
    } else {
      status = "error";
    }
```

---

## 클린 재시작 (API 라우트 변경)
```bash
pkill -f "next dev"; rm -rf .next; npm run dev
```

## 확인 (localhost)
- 미리보기 순서: **헤더 = 업체명 + ⭐**(리딩방명 빠짐) → 뱃지 → 대표·주소·신고기간 → **[리딩방명 ……… 🚨 신고 N]** 한 줄 → OG 카드 → 연결링크 바로가기.
- 인코딩: (캐시 비운 뒤) **네이버 카페 업체 미리보기 제목이 안 깨지고** 한글로 정상.
- 빌드 에러 없음.

## ⚠️ 적용 후
- **적용+재시작 끝나면 Cowork(나)에게 알려줘** → 내가 `link_previews` 캐시를 비워서, 깨진 채로 캐시된 것들이 새로 (정상 디코딩으로) 다시 긁히게 할게. (안 비우면 캐시된 깨진 제목이 계속 나옴.)

## 빌드·커밋
- 보류. 확인 후 단독 커밋. push·배포는 사용자 지시 시.
