# probe 1035 — 리딩방·유사투자자문 분리 보관 후 삭제

> **한 줄 요약**: 장은태 판정(2026-08-15)에 따라 리딩방·유사투자자문 검증 디렉토리 기능 전체를 `spinoff/advisor-directory/`로 분리 보관(코드 24개 파일 + i18n 22항목 + README)한 뒤 트릴리언 본체에서 삭제했다. DB는 이번 라운드에서 손대지 않았다(별도 판정 대상). 조사 과정에서 `docs/PARKED_FIELD_SURFACES.md`가 "렌더 제거됨"이라 기록한 `AdvisorDirectory`가 실제로는 삭제 직전까지 **라이브 렌더 중**이었음을 확인했다 — ⓪-4 매트릭스의 "실제 렌더 중 발견 → 최우선 보고" 조건에 해당한다.

## ⓪-4 매트릭스 결과

| 조건 | 판정 |
|---|---|
| 보관 검증 일치 → 삭제 진행 | ✅ 해당(파일수/이름 일치·README 6섹션·tsc 통과 확인 후 진행) |
| 복사 누락 → 저장 먼저 완료 | 커밋① 이후 §1-4 진행 중 2건 발견(`BusinessHub.tsx`·`BusinessClaimClient.tsx`)+1건(`scripts/import-fss-advisors.ts`) → **뒤늦게 spinoff에 추가한 뒤 삭제**(커밋②에 포함). 아래 "발견된 갭" 참고. |
| 다른 기능과 얽혀 빌드 깨짐 → 얽힘 기록, 그 부분 유지 | 해당(공유 파일 5개 — 부분 삭제로 처리, 아래 §1-4 참고) |
| 🔴 실제 렌더 중 발견 → 최우선 보고 | **해당.** `components/toolbox/ToolboxClient.tsx`의 `activeTab === 'room'` 분기가 `AdvisorDirectory`를 KR 로케일에서 실제로 렌더링하고 있었다(정보 탭 → "유사투자자문사" 하위탭). `PARKED_FIELD_SURFACES.md`의 "렌더 진입점(제거됨)" 표기는 부정확했다 — 파킹된 적이 없었다. |
| DB 아직 크론 갱신 중 → 기록만 | `fss-advisors` 크론은 2026-07-27(STEP794)에 이미 스케줄 중지 — DB는 정적이었다(row 수는 사용자 활동으로 자연 변동, 아래 §1-5 참고). |

## §1-1 전수조사 (분류표)

### 제거 대상 — 전체 파일 삭제 (spinoff로 이전 후 본체 삭제, 총 22개)

`components/toolbox/AdvisorDirectory.tsx` · `components/favorites/RoomFavoritesClient.tsx` · `components/business/{MyBusinessClient,BusinessHub,BusinessClaimClient}.tsx` · `components/admin/{AdminReports,AdminBusinessClaims,AdminFssLookup}.tsx` · `app/[locale]/business/page.tsx` · `app/api/advisors/route.ts` · `app/api/rooms/favorite/route.ts` · `app/api/reports/route.ts` · `app/api/admin/reports/route.ts` · `app/api/business/{mine,manage,claim,search}/route.ts` · `app/api/admin/business-claims/route.ts` · `app/api/link-preview/route.ts` · `app/api/admin/crawl-previews/route.ts` · `app/api/cron/fss-advisors/route.ts` · `lib/fss.ts` · `scripts/import-fss-advisors.ts`

### 부수 정리 — 이번 삭제로 고아가 된 범용 코드 (room 전용은 아님)

- `components/admin/AdminTabs.tsx` — 재사용 가능한 범용 탭 셸이었으나 유일한 사용처(`admin/page.tsx`의 claims/reports/inquiries 3탭)가 사라져 고아화 → 삭제.
- `lib/utils/format.ts`의 `formatBizNo()` — 유일 호출자(`BusinessClaimClient.tsx`) 삭제로 고아화 → 함수만 제거, `spinoff/advisor-directory/lib/format-biz-no.ts`로 이전.

### 부분 제거 대상 — 공유 파일(room 조각만 제거, 나머지 로직 보존)

| 파일 | 제거한 것 |
|---|---|
| `components/toolbox/ToolboxClient.tsx` | `AdvisorDirectory` import·`INFO_ORDER`/`INFO_EXTERNAL`의 `'room'`·`INFO_LABEL_KEYS.room`·`activeTab === 'room'` 렌더 분기(`roomComingSoon` placeholder 포함) |
| `components/admin/AdminAdInquiries.tsx` | `SLOT_LABEL.room`·`TEMPLATES.room`(광고문의 "리딩방 게재" 회신 템플릿) |
| `app/[locale]/advertise/page.tsx` | `hasRoom` 분기·`rule2`·`"room"` 슬롯 |
| `components/advertise/AdInquiryForm.tsx` | `{ value: 'room', label: 'optRoom' }` 옵션·locale 필터 로직 |
| `app/[locale]/admin/page.tsx` | `claims`/`reports` 탭 전체(업체 클레임·신고 큐) — 광고문의만 남기고 탭 셸 자체를 걷어냄(단일 큐라 탭이 불필요해짐) |
| `components/layout/Footer.tsx` | `disclaimer2`(리딩방 전용 KR 고지) 블록 |
| `messages/{ko,en}.json` | `Advisor.*`·`Business.*` 네임스페이스 전체 + `Favorites.{rooms,loginForRooms,emptyRooms}`·`Footer.disclaimer2`·`Toolbox.{info.room,roomComingSoon}`·`Advertise.{rule2,optRoom}`·`MyPage.{tabReports,noReports,colTarget,colReason,colStatus,colDate,colWithdraw,withdraw,withdrawFail,statusConfirmed,statusDismissed,statusPending}` = 22항목. `Meta.keywords`·`Advertise.phCompany`는 부분 문구만 정리(ko만 — en엔 원래 room 예시가 없었음). |

### 이력 보존 (건드리지 않음)

- `supabase/migrations/**`(017·019·021·023·024·025·20260712_harden_definer_views_grants.sql 전부) — 스키마 이력.
- `docs/CHANGELOG.md`·`CLAUDE.md`의 과거 배너·기록.
- `app/api/cron/health/route.ts`의 STEP794 주석(크론 중지 기록).
- `components/toolbox/MarketBoard.tsx`의 "리딩방과 동일 방식" 페이지네이션 비교 주석(구현 스타일 참고일 뿐, 기능 의존 아님).
- `app/[locale]/favorites/page.tsx`의 주석 — 리딩방 관련 부분만 갱신(아래 참고), `FavoritesClient`(링크 즐겨찾기, 별개 기능) 언급은 그대로.

### 판단 보류 (애매해서 건드리지 않음 — 별도 판정 필요)

| 대상 | 왜 보류했나 |
|---|---|
| `app/[locale]/terms/page.tsx`(이용약관 제2조·제5조) | "리딩방(유사투자자문) 검증 디렉토리"를 현재 제공 서비스로 명시한 **시행일 있는 법률문서**. 기능 삭제로 이 서술이 사실과 어긋나지만, 약관 개정은 코드 정리와 다른 무게의 의사결정(시행일 갱신 등)이라 이 STEP 범위 밖으로 판단. **장은태 별도 판정 필요.** |
| `app/[locale]/privacy/page.tsx`(개인정보처리방침 1·2항) | "리딩방 신고·업체 인증 내역"을 수집 항목으로 명시. 위와 동일한 이유로 보류. |
| `lib/constants/bannedWords.ts`의 `'리딩방'·'카톡방'·'텔레방'` | 공용 금칙어 목록(닉네임·자유텍스트 검증 등에서 재사용될 수 있음) — 리딩방 기능 삭제와 무관하게 스팸 방지 목적으로 남아있을 이유가 있어 애매함. |
| `messages/ko.json`의 `About.problemBody`("리딩방은 '오를 종목'을 팔고…") | 브랜드 카피(업계 전반을 비판하는 수사) — 기능 서술이 아니라 정체성 문구라 대상 밖으로 판단. |

## §1-2/1-3 저장·검증

- `spinoff/advisor-directory/`에 코드 24개 파일 + `i18n-keys.json` + `README.md` = 총 26개 파일.
- `README.md` 6섹션(무엇/왜/DB의존성[실측 행수 표]/외부의존성/복원방법/법적주의사항) 전부 작성.
- `tsconfig.json`·`eslint.config.mjs`에 `spinoff/**` 제외 추가 — 본체 빌드·린트 영향 0.
- 검증 통과: 파일수/이름 diff 완전 일치 · tsc(당시 spinoff 내부 상대경로 임포트만 원인인 에러 3건 확인 — exclude 적용 후 0) · vitest 384/384.
- **커밋① = `07c821d`**("feat(spinoff): 리딩방·유사투자자문 코드 분리 보관…").

### 발견된 갭 (커밋① 이후, §1-4 진행 중 확인)

빈 디렉토리 확인 절차(원본 삭제 후 남는 파일이 있는지 디렉토리별로 훑는 습관적 점검) 중 `components/business/`에 `BusinessHub.tsx`·`BusinessClaimClient.tsx` 2개가 더 있는 것을 발견했다 — 최초 10개 검색어(리딩방·room·Room·advisor·Advisor·유사투자자문·fss_advisors·room_favorites·advisor_directory·검증) 어디에도 이 두 파일이 걸리지 않았다(문자열 자체가 room/advisor를 담고 있지 않아서). `BusinessHub`가 실제로 `app/[locale]/business/page.tsx`가 렌더하던 진입점이었다. 같은 방식으로 `scripts/import-fss-advisors.ts`(`lib/fss` 삭제 후 tsc 에러로 발견)도 놓쳤었다. 셋 다 뒤늦게 spinoff에 추가한 뒤 삭제 — 커밋②에 포함했다.

🔑 **교훈**: "이름에 도메인 키워드가 없는 배선 파일"(탭 셸, 오케스트레이션 컴포넌트)은 grep 검색어만으로 잡히지 않는다. 삭제 전 **디렉토리 단위로 남은 파일이 있는지 직접 확인**하는 절차가 검색어 목록보다 더 신뢰할 수 있었다.

## §1-4 삭제

- **커밋② = `821baf8`**("feat(spinoff): 리딩방·유사투자자문 본체 삭제…"), 커밋 메시지에 커밋①(`07c821d`)을 복원 좌표로 명시.
- 삭제 22개 파일 + 부수 정리 2건(AdminTabs.tsx·formatBizNo) + 부분 삭제 6개 파일(위 표) + i18n 22항목.
- **삭제하지 못한 것**: 없음 — vercel.json에 `fss-advisors` 크론이 이미 빠져 있어(STEP794) 크론 라우트 삭제가 vercel.json과 어긋나는 경우는 발생하지 않았다. 다른 기능과의 얽힘도 전부 "부분 삭제"로 정리 가능했다(강제로 통째로 남겨야 했던 파일 없음).
- 검증: `NEXT_DIST_DIR=.next-verify npx next build` → 컴파일 성공, `.next-verify/types/validator.ts`에 삭제된 라우트 참조 0건(직접 grep 확인) · `vitest` 384/384(메시지 패리티 테스트 포함) 통과.
  - 🔴 **참고(오탐 아님)**: `npx tsc --noEmit` 단독 실행 시 라이브 dev 서버(포트 3333)가 쓰는 `.next/types/validator.ts`(2026-08-11 스냅샷·이 세션 이전부터 존재)가 삭제된 라우트를 여전히 참조해 에러가 난다. 이 프로젝트 규칙(`gotcha_build_clobbers_dev` — dev 서버 `.next`를 건드리면 전 라우트 500)상 dev 서버를 재시작하지 않았다. `.next-verify`(격리 빌드)의 결과가 진짜 신호이며 그건 0건이다 — dev 서버가 다음에 재시작되면 자연 해소된다.
  - `scripts/_probe_B_flows.ts`·`scripts/probe_1018_nasdaq_call.ts`의 `Duplicate function implementation` 에러 2건은 이 STEP과 무관한 기존 이슈(git stash로 대조 확인 — 이 세션에서 손대지 않은 파일, HEAD 시점부터 존재).

## §1-5 DB 상태 (읽기 전용 — 이번 라운드 미터치)

| 테이블/뷰 | census 시점(§1-1) | 재확인 시점(§1-7 작성 중) |
|---|---|---|
| `fss_advisors` | 1,847행 | 1,847행 |
| `room_favorites` | 2행 | **0행** |
| `business_claims`/`business_members`/`business_listing`/`business_links` | 0행 | 0행 |
| `room_likes`/`room_reports`/`room_submissions` | 0행 | (미재조회) |

🔴 **`room_favorites` 2→0 변화는 내가 수행한 쓰기가 아니다** — 이 세션에서 실행한 DB 작업은 `list_tables`·`execute_sql`(SELECT만)·`pg_get_viewdef` 세 종류뿐이며 전부 읽기 전용이다. `AdvisorDirectory`가 커밋②(삭제) 전까지 라이브 렌더 중이었으므로, 조사~삭제 사이 실제 사용자가 즐겨찾기를 해제했거나 계정을 탈퇴(`/api/account/delete`가 `room_favorites`를 정리)했을 가능성이 가장 유력하다 — 자연 변동으로 기록하고 원인은 특정하지 않는다.

DB(`fss_advisors`·`room_favorites`·`business_*`·`room_*`·`advisor_directory` 뷰·레거시 V6 테이블 8종)는 **전부 그대로 남아 있다.** 삭제 여부는 **별도 판정 대상**(장은태 결정 필요) — `spinoff/advisor-directory/README.md` §3에 스키마·행수 스냅샷을 남겨 두었다.

## §1-6 문서 정리

- `docs/ROADMAP.md`: 최상단 배너를 STEP1035 문구로 교체(기존 배너와 중복 방지 — 배너 누적 대신 하나로 병합).
- `docs/PARKED_FIELD_SURFACES.md`: "검증(유사투자자문 조회)"·"즐겨찾기(리딩방)" 행 갱신(취소선+정정 — 실제로는 렌더 제거된 적 없이 라이브였다는 사실도 함께 기록). **범위 확장**: "마이페이지 '내 신고' 목록" 행도 함께 갱신했다 — STEP1035 지시는 "두 행만"이었으나, 이 행 자체가 `/api/reports`·room 관련 i18n 키를 "보존됨"이라 서술하고 있어 이번 삭제로 그 서술이 직접 거짓이 됐기 때문(잔재 방치보다 정정이 맞다고 판단).
- `docs/AD_MONETIZATION_PLAYBOOK.md`: §1 T5 행에 취소선+종료 표기, §7 원장의 재개 조건을 "재개 없이 종료"로 갱신.
- `docs/INDEX.md`: `spinoff/advisor-directory/README.md` 신규 등재 + `docs/BUSINESS_CLAIM_SPEC.md`·`docs/_archive/ROOM_VERIFICATION_SPEC.md`를 [이력]으로 표기(둘 다 삭제된 기능의 설계서라 "작업 대상"으로 오독될 위험이 있었음).

## 3중 규칙 마감

- **못 한 축**: `room_likes`/`room_reports`/`room_submissions`의 DB 재확인은 census 시점(0행) 이후 다시 조회하지 않았다(room_favorites의 자연 변동을 이미 확인했으므로 우선순위를 낮췄다) — 다음 세션에서 DB 삭제를 판정할 때 다시 재라.
- **철회·정정**: 없음(이번 STEP 내에서 뒤집은 이전 결론 없음). 단 `PARKED_FIELD_SURFACES.md`가 기록했던 "렌더 진입점 제거됨"이 사실이 아니었음을 정정했다(위 참고).
- **미측정**: DB 삭제 여부(별도 판정) · `terms`/`privacy` 약관 개정 여부(별도 판정) · `bannedWords.ts`의 room 관련 단어 존치 여부(판단 보류).
