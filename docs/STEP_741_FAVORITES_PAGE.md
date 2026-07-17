# STEP 741 — 즐겨찾기 페이지 재편: 종목 hero + 리딩방 /en 숨김 (②a 3/3)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제:** STEP 740 완료. ②a 3/3(마지막).
**대상:** `app/[locale]/favorites/page.tsx` (+ 필요 시 `messages` Favorites 문구 소량).

## 목표
관심목록 페이지가 "종목·링크·리딩방 3개 동급"으로 쌓여 있던 것을 **관심 종목을 주인공(hero)** 으로, 링크·리딩방은 보조로. 리딩방 섹션은 **KR 전용**이라 `/en`에서 숨김(광고문의·푸터 로케일 작업과 일관).

## 현재 (참고)
```tsx
<section mb-7> t('watchlist') → <WatchlistClient />
<section mb-7> t('links')     → <FavoritesClient />
<section>      t('rooms')      → <RoomFavoritesClient />
```
순서는 이미 종목→링크→리딩방. 셋 다 `h2 text-sm` 동급이 문제.

## 구현
`app/[locale]/favorites/page.tsx`:
1. **locale 분기 추가**: 상단에서 `const { locale } = await params;` 이미 있음. `getTranslations`는 그대로. 리딩방 숨김용으로 `locale === 'en'` 사용(추가 import 불필요).
2. **관심 종목을 hero로**: watchlist 섹션 제목을 나머지보다 크게(예: `h2` → `text-base font-bold` + 바로 아래 한 줄 안내 `text-xs text-unjong-muted`에 "별표한 종목을 TR-AI 렌즈로 한눈에" 성격의 문구). 링크·리딩방 섹션 제목은 현행 `text-sm`(보조)로 유지.
   - 안내 문구가 새로 필요하면 `Favorites.watchlistHero`(ko "별표한 종목을 렌즈로 한눈에 봅니다" / en "Your starred stocks, seen through the lenses.") 최소 키만 ko·en 추가(패리티).
3. **리딩방 섹션 /en 숨김**: `{locale !== 'en' && (<section> … <RoomFavoritesClient /> </section>)}`로 감싼다. ko는 그대로 유지. (링크 섹션은 양쪽 유지.)
4. 순서 유지: 종목(hero) → 링크 → 리딩방(ko만). 페이지 상단 `h1`/`desc`는 그대로(또는 desc를 종목 중심으로 살짝 다듬어도 됨 — 선택).

> ko는 기능·구성 **불변**(리딩방 그대로), en만 리딩방 섹션이 빠진다. WatchlistClient(740)·FavoritesClient·RoomFavoritesClient 내부는 **안 건드림**.

## 마무리
```
npm run build   # tsc + messages.test.ts(패리티)
git add -A && git commit -m "feat(favorites): 관심 종목을 hero로 격상 + 리딩방 섹션 /en 숨김(KR 전용)·ko 불변" && git push
```

## 검증 (배포 후 Cowork 실측)
- `/favorites`(ko): 종목 섹션이 hero(제목 크게 + 안내 한 줄), 이어서 링크·리딩방 3섹션 모두.
- `/en/…/favorites`(en): 종목·링크만, **리딩방 섹션 없음**.
- 모바일에서 종목 hero + 렌즈 목록(740) 정상.
