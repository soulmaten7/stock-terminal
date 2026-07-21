<!-- 2026-07-21 -->
# 🅿️ 보류 기능 — 구 보드·정보 탭·유튜브·검증(유사투자자문) 필드 표면

> **상태: 컴포넌트·API·크론·데이터 전부 정상 동작. 렌더 호출부만 제거됨 — 어느 라우트에서도 화면에 안 뜬다.**
> 관련: `docs/STEP_767A_COMMAND.md`(/explore 신설) · `docs/STEP_767B_COMMAND.md`(필드 대전환) · `docs/LOCALE_SOURCE_PLAYBOOK.md` §11(보류 기능 프로토콜).

## 1. 왜 보류했나 (한 줄)
- **2026-07-21 장은태 최종 결정**: 필드 = **오늘(`/`) · 탐색(`/explore`) · 종목상세 · 관심 · 마이 — 5면뿐.**
- TR-AI 렌즈 전면화 방향에서, 6개국 보드 터미널·정보 탭(링크허브/피드)·유튜브 랭킹·검증(유사투자자문 조회)은 "탐색"(검색 + 렌즈 정렬 목록)으로 대체되는 구면(舊面)으로 판단 — 데이터가 나쁘거나 막혀서가 아니라 **제품 방향 축소** 결정.
- 백그라운드 파이프라인(크론·API)은 TR-AI 원료(렌즈 산출용 시세·거래대금)라 손대지 않고 전부 계속 돈다.

## 2. 무엇을 파킹했나 + 이미 깔아둔 배선

| 표면 | 렌더 진입점(제거됨) | 보존된 컴포넌트 | 보존된 API/크론/데이터 |
|---|---|---|---|
| 구 보드(6개국 터미널) | `app/[locale]/page.tsx`의 `<ToolboxClient>` 호출 | `components/toolbox/ToolboxClient.tsx` + `{Market,Us,Jp,Cn,Vn,Gb}MarketBoard.tsx` | `/api/krx/*`·`/api/yahoo/*-list`·`/api/cron/*-perf` 등 — **`/explore`가 그대로 재사용 중**(살아있는 사용처) |
| 정보 탭(링크허브·피드) | 위와 동일(ToolboxClient 내부 `info` 상위탭) | `ToolboxClient.tsx`(FEED_TABS·link_hub 렌더 로직) | `link_hub` 테이블·`/api/news`·`/api/dart`·`/api/sec` 등 피드 API 전부 무변 |
| 즐겨찾기(링크) | `app/[locale]/favorites/page.tsx`의 `<FavoritesClient>` 호출 | `components/favorites/FavoritesClient.tsx` | `/api/toolbox/favorite`·`link_hub_favorites` 테이블 |
| 유튜브 랭킹 | `page.tsx`의 `youtube_channels` 조회 + `<YoutubeRanking>`(ToolboxClient 내부) | `components/toolbox/YoutubeRanking.tsx` | `youtube_channels` 테이블·`/api/cron/youtube-refresh` |
| 검증(유사투자자문 조회) | ToolboxClient 내부 `info` 하위탭 `<AdvisorDirectory>` | `components/toolbox/AdvisorDirectory.tsx` | `fss_advisors` 테이블·`/api/advisors`·`/api/cron/fss-advisors`·`/api/business/*`(클레임) |
| 즐겨찾기(리딩방) | `favorites/page.tsx`의 `<RoomFavoritesClient>` 호출(`locale !== 'en'` 분기) | `components/favorites/RoomFavoritesClient.tsx` | `/api/rooms/favorite`·`room_favorites` 테이블 |
| 홈 리셋 스토어 | `Header.tsx`의 `useHomeReset` 호출(보드 전용 뷰 리셋 — 탐색/오늘엔 해당 개념 없음) | `stores/homeResetStore.ts`(파일 그대로) | — |

- `/toolbox` 라우트는 이미 STEP 이전부터 `/`로 리다이렉트(`app/[locale]/toolbox/page.tsx`) — 대상만 "구 보드"→"오늘"로 자연 전환, 코드 변경 없음.
- `app/[locale]/today/page.tsx`는 신설 `/`로 리다이렉트(오늘 콘텐츠가 루트로 이동·기존 `/today` 링크 보호).

## 3. 복원 절차 (나중에 이대로만 하면 켜짐)
1. **구 보드 복원**: `app/[locale]/page.tsx`(또는 새 라우트, 예 `/board`)에서 서버 컴포넌트가 `link_hub`·`youtube_channels`·`link_hub_favorites`를 조회해 `<ToolboxClient initialCategories={...} isLoggedIn={...} youtubeChannels={...} />`로 넘기던 STEP 767b 이전 커밋(`9c7679d` 시점 `app/[locale]/page.tsx`)을 참고해 그대로 복구.
2. **즐겨찾기(링크·리딩방) 복원**: `app/[locale]/favorites/page.tsx`에 `<FavoritesClient />`·`{locale !== 'en' && <RoomFavoritesClient />}` 섹션을 STEP 767b 이전 버전대로 재삽입.
3. **헤더 로고/메뉴 리셋 복원**: 보드가 다시 홈이 되면 `Header.tsx`에 `useHomeReset` 재도입(로고·메뉴 클릭 시 `reset()` 호출) — 지금은 오늘/탐색엔 "뷰 리셋" 개념이 없어 제거된 상태.
4. **광고 카피 원복**: `messages/{ko,en}.json`의 `Advertise.slot.roomWhere`를 원래 위치 문구("리딩방·검증 탭 · 리스트 상단/중간" 등)로 되돌림.
5. 그 외 컴포넌트·API·크론·DB는 전부 무변 상태라 추가 작업 불필요.

## 4. 비용·노력
- 렌더 호출부 재배선만 필요(컴포넌트·API·DB 스키마 변경 없음) — 반나절 이내 예상.

## 5. 재사용 범위
- 이 표는 "제품 방향으로 표면을 줄이되 백엔드는 유지"하는 파킹의 사례 — 데이터 소스 차단(예 `PARKED_HNX_VCI_ACTIVATION.md`)과 달리 **의도적 스코프 축소**에도 §11 프로토콜(코드 보존 + 문서화 + 복원 절차)이 그대로 적용됨을 보여준다. 향후 다른 탭/기능을 스코프에서 뺄 때도 동일 형식(표면→진입점→보존 위치→복원 절차) 재사용.

## 6. 발견된 잔여 이슈 (이 STEP 스코프 밖 — 별도 결정 필요)
- **증권사(broker) 광고 슬롯도 렌더 경로가 사라짐**: `BrokerRanking`·`BrokerAdRow`(광고 슬롯 렌더 위치)가 ToolboxClient 내부에만 있어 이번 파킹으로 함께 비노출됨. `Advertise.slot.brokerWhere`("종목·상품 탭 · 종목 표/증권사 리스트 10행마다")는 이제 존재하지 않는 위치를 가리켜 room 슬롯과 동일한 문제 — 이번 STEP은 room 슬롯만 명시돼 손대지 않음. 후속 STEP에서 `/advertise` 카피 전체 재정비 필요 여부 판단 필요.
