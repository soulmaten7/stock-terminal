<!-- 2026-07-27 -->
# 🅿️ 보류 기능 — 구 보드·정보 탭·유튜브·검증(유사투자자문) 필드 표면

> **상태: 컴포넌트·API·데이터 전부 정상. 렌더 호출부는 제거됨(어느 라우트에서도 화면에 안 뜬다). 🔴 2026-07-27부터 파킹 전용 크론 6개는 스케줄도 중지됨 — §6 참조.**
> 관련: `docs/STEP_767A_COMMAND.md`(/explore 신설) · `docs/STEP_767B_COMMAND.md`(필드 대전환) · `docs/LOCALE_SOURCE_PLAYBOOK.md` §11(보류 기능 프로토콜).

## 1. 왜 보류했나 (한 줄)
- **2026-07-21 장은태 최종 결정**: 필드 = **오늘(`/`) · 탐색(`/explore`) · 종목상세 · 관심 · 마이 — 5면뿐.**
- TR-AI 렌즈 전면화 방향에서, 6개국 보드 터미널·정보 탭(링크허브/피드)·유튜브 랭킹·검증(유사투자자문 조회)은 "탐색"(검색 + 렌즈 정렬 목록)으로 대체되는 구면(舊面)으로 판단 — 데이터가 나쁘거나 막혀서가 아니라 **제품 방향 축소** 결정.
- 백그라운드 파이프라인(크론·API)은 TR-AI 원료라 대부분 계속 돈다. **단 2026-07-27(STEP 794 §5)부터, 파킹된 표면에만 쓰이던 크론 6개는 스케줄을 중지**했다(vercel.json에서 제거) — 데이터가 어느 화면에도 안 뜨는데 매일 도는 낭비 제거. **kr-etp는 예외로 계속 돈다**(종목상세 KR ETF/ETN 헤더 현재가가 `kr_etp_snapshot`을 라이브로 읽어서 — 파킹 표면이 아님). 상세: §6.

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
| 마이페이지 '내 신고' 목록 (STEP 769) | `app/[locale]/mypage/page.tsx`의 activity 탭 인라인 JSX(별도 컴포넌트 파일 아님 — STEP 769 이전 커밋 `90ccc4a`의 해당 파일에서 원문 확인 가능) | 없음(인라인 코드였음 — 복원 시 `90ccc4a` 버전의 activity 탭 블록·`myReports` state·`withdrawReport` 핸들러·`Siren`/`Trash2` import를 그대로 재삽입) | `/api/reports` 라우트 무변(GET/DELETE 전부 보존) · 회원탈퇴(`/api/account/delete`)의 reports 삭제 로직도 무변 · i18n 키(`MyPage.tabReports`·`noReports`·`colTarget`·`colReason`·`colStatus`·`colDate`·`colWithdraw`·`withdraw`·`status*`·`withdrawFail`)는 사용처 없이도 보존(재사용 위해 삭제 안 함) |

- `/toolbox` 라우트는 이미 STEP 이전부터 `/`로 리다이렉트(`app/[locale]/toolbox/page.tsx`) — 대상만 "구 보드"→"오늘"로 자연 전환, 코드 변경 없음.
- `app/[locale]/today/page.tsx`는 신설 `/`로 리다이렉트(오늘 콘텐츠가 루트로 이동·기존 `/today` 링크 보호).

## 3. 복원 절차 (나중에 이대로만 하면 켜짐)
1. **구 보드 복원**: `app/[locale]/page.tsx`(또는 새 라우트, 예 `/board`)에서 서버 컴포넌트가 `link_hub`·`youtube_channels`·`link_hub_favorites`를 조회해 `<ToolboxClient initialCategories={...} isLoggedIn={...} youtubeChannels={...} />`로 넘기던 STEP 767b 이전 커밋(`9c7679d` 시점 `app/[locale]/page.tsx`)을 참고해 그대로 복구.
2. **즐겨찾기(링크·리딩방) 복원**: `app/[locale]/favorites/page.tsx`에 `<FavoritesClient />`·`{locale !== 'en' && <RoomFavoritesClient />}` 섹션을 STEP 767b 이전 버전대로 재삽입.
3. **헤더 로고/메뉴 리셋 복원**: 보드가 다시 홈이 되면 `Header.tsx`에 `useHomeReset` 재도입(로고·메뉴 클릭 시 `reset()` 호출) — 지금은 오늘/탐색엔 "뷰 리셋" 개념이 없어 제거된 상태.
4. **광고 카피 원복**: `messages/{ko,en}.json`의 `Advertise.slot.roomWhere`를 원래 위치 문구("리딩방·검증 탭 · 리스트 상단/중간" 등)로 되돌림.
5. **마이페이지 '내 신고' 복원**(STEP 769): `git show 90ccc4a:app/[locale]/mypage/page.tsx`로 파킹 전 원문을 뽑아 activity 탭의 신고 목록 블록·관련 state/핸들러·아이콘 import를 되돌림. 리딩방(검증) 표면이 함께 복원될 때 같이 복원하는 게 자연스러움(신고 대상=주로 리딩방).
6. 그 외 컴포넌트·API·크론·DB는 전부 무변 상태라 추가 작업 불필요.

## 4. 비용·노력
- 렌더 호출부 재배선만 필요(컴포넌트·API·DB 스키마 변경 없음) — 반나절 이내 예상.

## 6. 파킹 전용 크론 스케줄 중지 (2026-07-27 · STEP 794 §5)
- **왜**: §2의 표면(구 보드·유튜브·검증)이 렌더 진입점 0개(`ToolboxClient`를 import하는 페이지가 없음 — `app/[locale]/toolbox/page.tsx`는 `redirect({href:"/"})`만)라, 그 표면에만 데이터를 대던 크론들은 아무 화면에도 안 뜨는 테이블을 매일 갱신하는 순수 낭비였음.
- **중지한 6개**(vercel.json `crons`에서 스케줄만 제거): `jp-perf` · `cn-perf` · `vn-perf` · `gb-perf` · `fss-advisors` · `youtube-refresh`.
- **라우트 파일·컴포넌트·테이블·데이터는 그대로 보존**(삭제 안 함). 마지막 크론 실행 시점의 스냅샷이 테이블에 그대로 남아있음.
- **복원 = vercel.json에 스케줄 한 줄씩 재등록**(경로·cron 표현식은 git 히스토리의 이 커밋 이전 vercel.json 참조). 표면 자체를 되살리려면 그와 별개로 §3 렌더 재배선도 필요.
- **중지 안 한 것**: `kr-etp`(종목상세 KR ETF/ETN 헤더 현재가·등락·거래대금이 `/api/etf-holdings`→`kr_etp_snapshot`을 라이브로 읽음 — 파킹 표면 아님, 멈추면 상세 헤더 가격이 stale). health 체크의 해당 테이블 감시도 유지(크론이 계속 도므로).
- health 크론(`/api/cron/health`) CHECKS에서 중지된 5개 항목(`jp/cn/vn/gb 시세`·`유사투자자문`)도 **함께 제거**함 — 안 그러면 이 테이블들이 stale로 굳어 매일 오탐. `kr-etp` 체크는 유지(크론 유지). 복원 시 vercel.json 재등록과 함께 health CHECKS도 되돌리면 됨.

## 5. 재사용 범위
- 이 표는 "제품 방향으로 표면을 줄이되 백엔드는 유지"하는 파킹의 사례 — 데이터 소스 차단(예 `PARKED_HNX_VCI_ACTIVATION.md`)과 달리 **의도적 스코프 축소**에도 §11 프로토콜(코드 보존 + 문서화 + 복원 절차)이 그대로 적용됨을 보여준다. 향후 다른 탭/기능을 스코프에서 뺄 때도 동일 형식(표면→진입점→보존 위치→복원 절차) 재사용.

## 6. 발견된 잔여 이슈 (이 STEP 스코프 밖 — 별도 결정 필요)
- **증권사(broker) 광고 슬롯도 렌더 경로가 사라짐**: `BrokerRanking`·`BrokerAdRow`(광고 슬롯 렌더 위치)가 ToolboxClient 내부에만 있어 이번 파킹으로 함께 비노출됨. `Advertise.slot.brokerWhere`("종목·상품 탭 · 종목 표/증권사 리스트 10행마다")는 이제 존재하지 않는 위치를 가리켜 room 슬롯과 동일한 문제 — 이번 STEP은 room 슬롯만 명시돼 손대지 않음. 후속 STEP에서 `/advertise` 카피 전체 재정비 필요 여부 판단 필요.
