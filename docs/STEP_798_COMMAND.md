# STEP 798 — 레이아웃·문구 마감 (탐색 폭 회귀 · 마이 정렬 · 로그인 복귀 · 중복 문구 · 죽은 키)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)
**⚠️ STEP 797 완료 후 실행**

**전제 상태**: STEP 797 커밋 이후 HEAD · 트리 클린

**배경(07-22 · Cowork 재검수)**: 795/796의 잔여·부작용 정리. 각 항목 독립이므로 하나씩 확실히.

---

## 수정

### 1) 탐색 폭 회귀 (640~1023px)

- 796에서 탐색 컨테이너가 `max-w-[680px]` → PageShell(`max-w-[1040px]`)로 바뀌었는데, 본문 폭 제한이 `lg:max-w-[680px]`(≥1024px)에만 걸려 **태블릿·작은 노트북 구간에서 탐색 본문이 680 → 최대 976px로 넓어짐**(오늘 화면과 리듬 어긋남·796 명세 "lg 이상에서만 체감" 위반).
- 조치: **PageShell은 건드리지 말고**(오늘 화면 깨짐) 탐색 쪽에서만 중간 구간 폭을 680으로 제한. 오늘·관심·상세의 렌더는 변화 0이어야 함.

### 2) 마이페이지 정렬 누락

- 5면 중 **마이만 `max-w-7xl`**(1280px에서 좌측 24px) → 관심↔마이 이동 시 본문이 튐(796이 잡으려던 그 증상). 796 표에서 마이가 누락됨.
- 조치: 마이도 PageShell 적용(레일 없음·`mobilePadded` 여부는 현행 모바일 렌더가 안 바뀌는 쪽으로).

### 3) 로그인 후 복귀 누락 2곳

- `components/favorites/WatchlistClient.tsx` 관심 화면 로그인 링크 — `next` 없음 → 로그인 후 홈. **로그인 유도가 가장 많이 일어나는 화면**.
- `app/[locale]/mypage/page.tsx` 비로그인 리다이렉트 — `next` 없음.
- 조치: 795에서 만든 쿠키 왕복 방식 그대로 재사용(`safeNextPath` 가드 포함). **`redirectTo`는 절대 건드리지 말 것**(710D).
- 회원가입(이메일 확인) 경로도 `post_login_next`를 심는지 확인해 가능하면 통일(무리면 사유 기재).

### 4) 파트 헤더 카운트 vs 실제 카드 수 불일치

- `partHeaderCount`는 `fscore.supported`일 때만 F-Score를 세는데, F-Score 카드는 **미지원이어도 "데이터 부족" 카드로 렌더**됨 → "6가지"인데 카드 7장. 극단적으로 `lenses.length===0 && fscore && !supported`면 **"0가지 방법으로 따로 보기"**.
- 조치: **카운트를 실제 렌더되는 카드 수와 동일한 소스에서 도출**(렌더 조건과 같은 식). 0이면 파트 헤더·닫는 카드 자체를 렌더하지 않음(결측 문법).

### 5) 관심 화면 중복 제목·중복 문장

- `favorites/page.tsx`의 `h1`(`Favorites.title`)과 `h2`(`Favorites.watchlist`)가 **글자까지 동일**("관심종목") — 795 §9 통일의 부작용.
- 바로 아래 `Favorites.desc`("관심 종목을 렌즈로 한눈에 봐요.")와 `Favorites.watchlistHero`("별표한 종목을 렌즈로 한눈에 봅니다") = **같은 뜻 두 줄 + 어미 혼용**. en도 동일 중복.
- 조치: 제목 1개·설명 1문장으로 축약(해요체). 미사용이 된 키는 ko/en 동시 제거.

### 6) ETF 개요 3열 잘림

- `EtfLensClient.tsx`의 개요가 `grid-cols-3` + `truncate`인데 796으로 컨테이너가 1280→1040으로 **좁아져 잘림 확률 상승**.
- 조치: 모바일·중간 폭에서 2열 또는 `line-clamp-2`로 값이 읽히게. 운용사·카테고리 같은 긴 값 기준으로 확인.

### 7) 문구 잔여 3건

- `messages/ko.json`의 `StockLens.narrativeMethodFscore` 합니다체 1건 → 해요체(en 불변).
- `MyPage.watchlistCount` 비문("0개 관심종목에 담겨 있어요") → "관심종목 {n}개를 담았어요" 계열(en 정상이므로 ko만).
- 795 §9 정본("관심종목") 기준으로 남은 표기 흔들림(띄어쓰기 등) 정리.

### 8) 죽은 키·경로 정리

- `Advertise.slot.*` 9키 × ko/en = **18키**(795 §11에서 렌더 제거됨) → 삭제.
- 참조 0인 키: `Nav.coin`, `Header.notReady`, `StockLens.currentPrice`, `StockLens.lensDirection` → 삭제(패리티 유지).
- 죽은 CSS: `app/globals.css`의 `.font-display`·`.font-mono-price`·`.animate-fadeIn`·`.unjong-card-highlight` → 삭제(tsx 참조 0 재확인 후).
- `/coin` — 헤더에서 숨기고 사이트맵에서도 뺐으나 `app/robots.ts` disallow에 없어 크롤 가능 → **disallow 추가 또는 `noindex`**.
- ⚠️ 파킹된 것(`FavoritesClient`·`RoomFavoritesClient`·toolbox 계열)은 **삭제 금지**(`docs/PARKED_FIELD_SURFACES.md` 명시 대상).

### 9) 존재하지 않는 심볼 — 색인 방지

- 이름 미해석 + 렌즈 0 + 공시 없음인 심볼이 200으로 렌더되고 사이트맵에도 등재됨 → 최소한 `robots: { index: false }` 처리(완전한 404 전환은 범위 밖·후속).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(ko/en 패리티) · `npm run build`
2. **폭 실측**: 375 / 768 / 1024 / 1280 / 1440px에서 오늘·탐색·관심·마이·상세의 **본문 좌측 x·폭** 측정 → 1280px에서 5면 좌측 동일, 768px에서 탐색이 오늘과 같은 리듬인지.
3. 로그인 복귀: 관심 화면·마이에서 로그인 → **원래 화면 복귀**(실제 구글 로그인). ko/en.
4. F-Score 미지원 종목에서 헤더 숫자 = 실제 카드 수, "0가지" 미발생.
5. 관심 화면 제목·설명 1개씩 · ETF 개요 값 읽힘 · `/coin` robots 확인.
6. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ docs/STEP_798_COMMAND.md
   git commit -m "STEP 798: explore width regression, mypage shell, login return, count consistency, wording and dead key cleanup"
   git push
   ```

## 완료 보고 → Cowork에게: 폭 실측표(5폭 × 5면) + 로그인 복귀 실측 + 삭제한 키 목록 + 커밋 해시.
