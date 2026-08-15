# spinoff/advisor-directory — 리딩방·유사투자자문 검증 디렉토리 (분리 보관)

> 2026-08-15 STEP1035로 트릴리언 본체에서 분리·삭제. **이 폴더는 트릴리언 빌드에 포함되지 않는다**(`tsconfig.json` exclude). 다른 플랫폼으로 재사용할 가치가 있어 코드만 보존한다.

## ① 무엇인가

금융감독원(FSS) '파인(FINE)' 유사투자자문업자 신고 원장을 매일 수집해, "리딩방(유사투자자문업자)"이 실제로 금감원에 신고된 곳인지 사용자가 조회할 수 있게 하는 검증 디렉토리 기능이었다. 핵심 요소:

- **조회**: 금감원 신고 업체 전체 검색 + 인증(운영자가 직접 클레임한) 채널 우선 노출 + 관심(즐겨찾기)순 정렬.
- **신고**: 사용자가 "허위·과장 수익률", "먹튀(잠적)", "미등록·사칭 의심" 등 사유로 특정 업체를 신고 → 관리자 검토 → 확정 시 공개 반영.
- **업체 클레임**: 리딩방 운영자가 자기 업체를 검색해 "본인 인증" 신청 → 사업자등록증 등 서류 업로드 → 관리자 승인 → 채널 링크(텔레그램/카카오/유튜브 등) 직접 관리.
- **관리자 처리 큐**: 업체 클레임 승인/반려, 신고 검토, (공유) 광고 문의 처리를 한 페이지에서 처리.
- 별점·후기 등 미검증 평가는 없음 — "금감원 등록·신고 여부"라는 사실 + "누적 즐겨찾기"라는 관심도만 노출(2026-06 리브랜드 결정, CLAUDE.md 참고).

## ② 왜 분리·삭제했나

**장은태 판정(2026-08-15)**: *"리딩방 검증은 다른 플랫폼이나 다르게 이용할 가치가 있어 보여서 미뤄둔 거였어. 그런데 이게 이렇게 섞이게 됐으니 확실히 넘어가자. 우리 플랫폼에서 사용 안 할 거야. 단 이건 다른 플랫폼으로 다르게 이용할 수 있을 것 같으니 파일과 내용을 따로 정리해서 폴더로 넣어두자. 그리고 우리 플랫폼에서는 리딩방 관련 내용을 삭제, 없애버려."*

배경: 2026-07-30 이후 트릴리언은 **US 시장 단독 개발**로 피벗했고(`CLAUDE.md` "🇺🇸🔒 전면 US 단독"), 리딩방·유사투자자문은 **한국 시장에 특유한 규제 개념**(자본시장법상 유사투자자문업)이라 US 제품 방향과 무관하다. 또한 `docs/AD_MONETIZATION_PLAYBOOK.md` §1은 이미 T5(리딩방/투자자문 게재)를 "규제 리스크·파이 작게"로 분류했고, §5 KR 판정은 "표시의무 강제 UI 전까지 보류"였다 — 즉 이 기능은 수익 모델에서도 이미 우선순위가 낮았다.

## ③ DB 의존성

🔴 **2026-08-15 후속 STEP으로 아래 테이블/뷰는 트릴리언 프로덕션 DB에서 DROP됐다.** 스키마(CREATE TABLE/VIEW/INDEX/RLS/트리거/함수 원문)는 [`schema.sql`](./schema.sql)에 그대로 보관돼 있다 — `schema.sql`을 그대로 실행하면 스키마가 복원된다(격리된 스키마에서 실제로 재구축해 검증 완료, `schema.sql` 헤더 참고). **데이터는 덤프하지 않았다** — 이유는 `schema.sql` 헤더 주석 참고(요약: `fss_advisors`는 개인정보를 담고 있고 금감원에서 재수집 가능·나머지 12개 테이블은 삭제 시점 전부 0행이라 보관할 데이터가 없었음).

DROP 직전(2026-08-15) 실측 행 수:

| 이름 | 종류 | 행 수 | 비고 |
|---|---|---|---|
| `fss_advisors` | 테이블 | 1,847 | 금감원 파인(FINE) 원장 캐시. `biz_no` PK. |
| `room_favorites` | 테이블 | **0**(🔴 아래 참고) | 사용자 즐겨찾기(관심도 집계에 사용). |
| `room_likes` | 테이블 | 0 | |
| `room_reports` | 테이블 | 0 | 사용자 신고. |
| `room_submissions` | 테이블 | 0 | 사용자가 직접 등록한 미인증 채널. |
| `business_claims` | 테이블 | 0 | 업체 인증 신청(서류 URL 포함). |
| `business_members` | 테이블 | 0 | 인증된 업체 담당자(owner/manager). |
| `business_listing` | 테이블 | 0 | 업체 소개(intro) 텍스트. |
| `business_links` | 테이블 | 0 | 업체가 등록한 채널 링크. |
| `link_previews` | 테이블 | 1,005 | OG 링크 프리뷰 캐시(advisor 채널 링크 전용, `/api/link-preview`가 lazy 크롤 후 upsert). 🔴 **DROP 대상에서 빠졌다** — 아래 참고. |
| `advisor_directory` | 뷰(SECURITY DEFINER) | — | `fss_advisors` + `room_likes`/`room_reports`/`room_favorites`/`room_submissions` 조인. 로그아웃 방문자에게도 공개 디렉토리를 서빙하기 위해 DEFINER로 유지되고 있었다(`supabase/migrations/20260712_harden_definer_views_grants.sql`). |

🔴 **`room_favorites` 행 수 정정(이 리뷰에서 발견)**: 위 표는 한때 이 README에 "2행"으로 적혀 있었다 — STEP1035 §1-1 전수조사(코드 삭제 이전, 2026-08-15) 시점 관측값이었다. 이후 같은 날 §1-5 재확인·그리고 훨씬 나중 DB DROP 직전 재확인 모두 **0행**으로 일관되게 나왔다(`docs/probe_1035_advisor_spinoff.md` §1-5 표·`docs/CHANGELOG.md` 참고 — 둘 다 처음부터 0행으로 기록돼 있었다. 이 README만 옛 값을 그대로 두고 있었다). **DROP은 0행 상태에서 실행됐으므로 DROP 자체가 사용자 데이터를 파기한 것은 아니다.** 다만 🔴 **한 시점(§1-1)에 실사용자 즐겨찾기 2건이 관측됐고, 그 데이터는 어느 시점에도 별도로 덤프·백업된 적이 없다** — DROP 이전에 이미 사라졌다(가장 유력한 경로: `AdvisorDirectory`가 그때까지 라이브였으므로 실사용자의 즐겨찾기 해제, 또는 계정 탈퇴 시 `/api/account/delete`의 자동 정리 — 둘 다 정상적인 사용자 자신의 조작이지 우리가 관리자 권한으로 지운 게 아니다. 확정할 수는 없다). 즉 그 2건의 상태는 **DROP과 무관하게, DROP 이전에 이미 기록 없이 사라졌다.** 자세한 내용은 `docs/PARKED_TERMS_PRIVACY_ACTIVATION.md`에도 남겨뒀다.

🔴 **`link_previews`가 DROP 대상에서 빠졌다(이 리뷰에서 발견, 아직 미조치)**: `lib/og.ts`(OG 스크레이퍼, 이번에 이 폴더로 이관됨)를 조사하다 발견 — `link_previews` 테이블(1,005행, advisor 채널 링크 OG 캐시 전용)은 이름에 `advisor`/`room`/`leading`/`business_*` 패턴이 없어서 DB 정리 때 조회 범위에 안 걸렸다. **아직 트릴리언 프로덕션 DB에 그대로 남아 있다** — 삭제 여부는 별도 판정 대상.

**원래 정의(마이그레이션)는 `supabase/migrations/019_platform_directory.sql`·`021_fss_advisors.sql`·`023_leading_room_votes.sql`·`024_room_view_increment.sql`·`025_channel_follower.sql`에 흩어져 있었다** — 이 마이그레이션 파일들은 git 이력이라 삭제하지 않고 그대로 둔다. `advisor_directory` 뷰 자체의 `CREATE VIEW` 문은 그중 어디에도 커밋된 적이 없어(Supabase MCP로 직접 적용된 것으로 추정) `schema.sql`이 유일한 원문 기록이다.

DROP된 13개 테이블 + 1개 뷰 전체(`fss_advisors`·`leading_rooms`·`leading_room_votes`·`room_favorites`·`room_likes`·`room_reports`·`room_submissions`·`room_reviews`·`room_review_reports`·`business_claims`·`business_members`·`business_listing`·`business_links`·`advisor_directory`)의 완전한 DDL은 `schema.sql`에 있다 — 그중 `leading_rooms`·`leading_room_votes`·`room_reviews`·`room_review_reports`는 **이번 STEP 이전에 이미 죽어 있던(코드 미참조·0행) V6 시절 레거시**였지만, 이 스키마 클러스터 안에 있고(FK로 `fss_advisors`와 연결) 다른 살아있는 기능이 참조하지 않아 함께 DROP했다.

🔴 **범위 밖으로 남긴 것**: `platform_discussions`·`platform_discussion_likes`·`platform_discussion_reports`·`products`(마이그레이션 `019_platform_directory.sql`)는 리딩방 전용이 아니라 **상품(ETF 등) 리뷰까지 포괄하는 별개의(여전히 0행·미사용이지만 다른 도메인) 기능**이라 DROP하지 않았다. `public.update_target_discussion_count()` 함수가 `target_type='room'`일 때 `leading_rooms`를 참조하는 분기를 갖고 있었으나, `platform_discussions` 자체가 도달 불가능한 죽은 코드라 `leading_rooms` DROP 이후에도 실행될 길이 없다(상세: `schema.sql` 맨 아래 주석).

## ④ 외부 의존성

### 전제

🔴 이 코드는 **Next.js App Router + Supabase**를 전제로 짜여 있다 — `app/[locale]/...` App Router 파일 규칙(`page.tsx`·`route.ts`)·Supabase Auth(`auth.uid()` RLS)·Supabase Postgres(RLS·SECURITY DEFINER 뷰·트리거)를 그대로 쓴다. 다른 프레임워크(Pages Router·Remix 등)나 다른 백엔드(Firebase 등)로 재구현하려면 라우팅·인증·DB 접근 계층을 전부 새로 짜야 한다.

### 폴더 밖 코드 import — 다른 플랫폼에서 재구현하거나 대체해야 하는 것

이 spinoff 안의 파일들이 `@/`로 참조하는 것 중, **이 폴더 밖(트릴리언 본체)에만 있고 이 폴더 안으로는 이관되지 않은** 모듈. `lib/nts.ts`·`lib/og.ts`는 이번 리뷰(2026-08-15)에서 리딩방 전용임을 확인해 이 폴더 안으로 이관했으므로 **더 이상 외부 의존이 아니다**(§⑤ 참고).

| import | 무엇을 하는 모듈인가 |
|---|---|
| `@/i18n/navigation` | next-intl 로케일 인지 라우팅 헬퍼(`redirect`·`Link` 등, ko/en 프리픽스 자동 처리). 트릴리언의 다국어 라우팅 설정에 묶여 있다 — 새 플랫폼이 다국어가 아니면 그냥 `next/navigation`으로 대체 가능. |
| `@/lib/clientCache` | 클라이언트 사이드 메모리 캐시(`getCache`/`setCache`) — `AdvisorDirectory.tsx`가 목록·상세 조회 결과를 잠깐 캐싱하는 데 씀. 범용 유틸이라 `localStorage`/`Map` 기반으로 몇 줄이면 재구현 가능. |
| `@/lib/supabase/admin` | 서비스 롤(service_role) 키로 만든 Supabase 관리자 클라이언트 — RLS를 우회해 서버(API 라우트)에서 전체 데이터를 읽고 쓸 때 쓴다. `SUPABASE_SERVICE_ROLE_KEY` 환경변수가 필요하다. |
| `@/lib/supabase/server` | 요청 쿠키 기반 Supabase 서버 클라이언트 — 로그인한 사용자 세션으로 RLS가 적용된 채 쿼리할 때(`auth.getUser()` 등) 쓴다. |
| `@/lib/utils/format` | 범용 포맷 유틸(`formatPhone` 등 — 이 spinoff에서는 `formatPhone`만 씀). `formatBizNo`는 원래 같은 파일에 있었으나 STEP1035에서 이 spinoff 전용으로 확인돼 `lib/format-biz-no.ts`(이 폴더 안)로 이미 이관돼 있다. |

### 외부 서비스·API

- **금융감독원 '파인(FINE)' 유사투자자문업자 신고현황** — `lib/fss.ts`의 `importFssAdvisors()`가 파인 사이트를 페이지네이션(174페이지 순회)으로 수집해 `fss_advisors`에 upsert. 공식 API가 아니라 **페이지 순회 방식**(비공식) — 파인 사이트 구조가 바뀌면 깨질 수 있다.
- 수집을 트리거하던 크론(`app/api/cron/fss-advisors/route.ts`, `Bearer ${CRON_SECRET}` 인증)은 **2026-07-27(STEP794 §5)에 이미 스케줄이 중지**되어 있었다(`vercel.json`에서 제거됨, 라우트 파일만 존재) — 즉 `fss_advisors`는 이 STEP 이전부터 이미 갱신이 멈춰 있었다.
- **국세청 사업자등록정보 진위확인(data.go.kr odcloud)** — `lib/nts.ts`의 `verifyBusiness()`가 업체 클레임 심사(`nts_valid` 검증)에 쓴다. 🔴 **환경변수 `DATA_GO_KR_KEY`(국세청 API 일반 인증키) 필요** — 없으면 조용히 `'unverified'`를 반환할 뿐 에러는 안 낸다(차단하지 않고 관리자 수기 검토로 넘어가는 설계). data.go.kr에서 발급받아야 한다.
- **OG 메타태그 스크레이핑**(`lib/og.ts`) — 업체가 등록한 채널 링크(텔레그램·카카오·유튜브 등)의 미리보기(제목·이미지·설명)를 서버에서 직접 fetch해 파싱한다. 외부 API가 아니라 **대상 URL에 직접 HTTP 요청**을 보내는 방식이라, 사설 IP·localhost 등은 `isBlockedHost()`로 차단해 SSRF를 막는다. `link_previews` 테이블에 upsert.

## ⑤ 복원 방법

1. **복원 좌표**: 이 폴더가 추가된 커밋(STEP1035 §1-2, 저장)과 원본이 트릴리언 본체에서 삭제된 커밋(STEP1035 §1-4, 삭제) 두 개의 정확한 해시는 `docs/probe_1035_advisor_spinoff.md`와 `docs/CHANGELOG.md`의 2026-08-15 STEP1035 블록에 기록되어 있다.
2. 이 폴더의 각 파일을 원래 경로(`spinoff/advisor-directory/` 접두어를 뗀 나머지 경로)로 복사.
3. **공유 파일에서 갈라져 나온 부분**은 이 spinoff에 포함되어 있지 않다 — 새 플랫폼에서 아래 로직을 새로 작성해야 한다:
   - `components/toolbox/ToolboxClient.tsx`의 `room` 탭 라우팅(`INFO_ORDER`/`INFO_EXTERNAL`에 `'room'` 포함 + `activeTab === 'room'` 분기).
   - `components/admin/AdminAdInquiries.tsx`의 `SLOT_LABEL.room`/`TEMPLATES.room`(광고 문의 중 "리딩방 게재" 항목).
   - `app/[locale]/advertise/page.tsx` · `components/advertise/AdInquiryForm.tsx`의 `room` 슬롯 옵션(`hasRoom`/`rule2`/`optRoom`).
   - `app/[locale]/admin/page.tsx`의 `claims`/`reports` 탭 구성(이 spinoff의 `AdminBusinessClaims`/`AdminReports`/`AdminFssLookup`을 다시 배선).
4. `spinoff/advisor-directory/i18n-keys.json`에 삭제 당시(ko/en) 문구가 그대로 들어 있다 — 새 플랫폼의 i18n 파일에 병합.
5. DB 스키마는 `schema.sql`을 그대로 실행해 만든다(③ 참고 — 격리 스키마에서 재구축 검증 완료).
6. Supabase Storage 버킷 `business-docs`(업체 클레임 서류 서명 URL 발급에 쓰이던 것, `app/[locale]/admin/page.tsx`에서 `admin.storage.from('business-docs').createSignedUrl(...)` 참고 — 이 spinoff 코드 밖에 있던 로직이므로 새로 구성 필요)도 별도로 준비해야 한다.
7. ④의 "폴더 밖 코드 import" 표에 있는 5개 모듈을 새 플랫폼에서 재구현하거나 새 프로젝트의 동등한 모듈로 경로를 바꿔 연결한다. `DATA_GO_KR_KEY`·`SUPABASE_SERVICE_ROLE_KEY` 등 환경변수도 새로 발급·설정해야 한다.

## ⑥ 법적 주의사항

- **유사투자자문업 광고 표시의무(2024.8 개정 자본시장법)**: 유사투자자문업자 광고 시 "유사투자자문업자이며 개별 투자상담이 불가함"을 명시해야 하고, 근거 없는 수익률 우위 주장·손실보전/이익보장 표현은 금지된다(위반 시 3년 이하 징역 또는 1억원 이하 벌금). 트릴리언에서는 이 표시의무를 UI로 강제하지 못해 `docs/AD_MONETIZATION_PLAYBOOK.md` §5 KR·§7에서 T5(리딩방 게재)를 **보류** 처리해 두었다 — 재사용하는 플랫폼은 이 표시의무를 실제로 강제하는 UI를 갖추기 전에는 유료 게재를 열지 말 것.
- 유사투자자문업자는 원칙적으로 **단방향 채널만** 허용된다 — 1:1 리딩방 운영은 정식 투자자문업자만 가능. 이 디렉토리는 "신고 여부 조회"이지 "안전 인증"이 아니라는 점을 반드시 화면에 명시해야 한다(기존 문구: `Advisor.notice`/`Footer.disclaimer2` — 안전성·수익성 보증 안 함, 신고 안 된 익명 리딩방 주의).
- "신고"·"인증" 표시가 **안전 보증이 아니라는 점**을 매 화면에서 반복 고지해야 규제·신뢰 리스크가 낮아진다(원 서비스 문구가 이 원칙을 지키고 있었다 — `i18n-keys.json` 참고).
- 이 기능은 **한국(KR) 규제 전제로 설계**되었다 — 다른 국가에서 재사용하려면 그 나라의 유사 규제(투자자문·투자광고 관련 법)를 별도로 확인해야 한다.
