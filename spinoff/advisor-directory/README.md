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

## ③ DB 의존성 (⚠️ 이번 라운드에서 트릴리언 쪽 DB는 삭제하지 않았다 — 아래는 실측 스냅샷)

이 폴더의 코드가 참조하는 Supabase(`ccbwxcszdoyjxvckedfp`) 테이블/뷰, 2026-08-15 실측 행 수:

| 이름 | 종류 | 행 수 | 비고 |
|---|---|---|---|
| `fss_advisors` | 테이블 | 1,847 | 금감원 파인(FINE) 원장 캐시. `biz_no` PK. |
| `room_favorites` | 테이블 | 2 | 사용자 즐겨찾기(관심도 집계에 사용). |
| `room_likes` | 테이블 | 0 | |
| `room_reports` | 테이블 | 0 | 사용자 신고. |
| `room_submissions` | 테이블 | 0 | 사용자가 직접 등록한 미인증 채널. |
| `business_claims` | 테이블 | 0 | 업체 인증 신청(서류 URL 포함). |
| `business_members` | 테이블 | 0 | 인증된 업체 담당자(owner/manager). |
| `business_listing` | 테이블 | 0 | 업체 소개(intro) 텍스트. |
| `business_links` | 테이블 | 0 | 업체가 등록한 채널 링크. |
| `link_previews` | 테이블 | 1,005 | OG 링크 프리뷰 캐시(advisor 채널 링크 전용, `/api/link-preview`가 lazy 크롤 후 upsert). |
| `advisor_directory` | 뷰(SECURITY DEFINER) | — | `fss_advisors` + `room_likes`/`room_reports`/`room_favorites`/`room_submissions` 조인. 로그아웃 방문자에게도 공개 디렉토리를 서빙하기 위해 DEFINER로 유지되고 있었다(`supabase/migrations/20260712_harden_definer_views_grants.sql`). |

**정의(스키마)는 `supabase/migrations/021_fss_advisors.sql`에 있다.** `advisor_directory` 뷰 자체의 `CREATE VIEW` 문은 git에 커밋된 마이그레이션 파일로 남아있지 않고(Supabase MCP로 직접 적용된 것으로 추정), 위 표의 뷰 정의는 2026-08-15 `pg_get_viewdef()`로 라이브 조회한 스냅샷이다 — 다른 플랫폼에서 재사용하려면 이 README의 정의를 참고해 다시 작성해야 한다.

또한 아래는 **이번 STEP에서 이미 죽어 있던(코드 미참조·0행) V6 시절 레거시 스키마**다 — 리딩방 기능의 더 이전 버전(별점·후기 방식) 잔재이며, 이 spinoff와 직접 관련은 없지만 같은 도메인이라 기록만 남긴다: `leading_rooms`·`leading_room_votes`·`platform_discussions`·`platform_discussion_likes`·`platform_discussion_reports`·`room_reviews`·`room_review_reports`·`products`(마이그레이션 `019_platform_directory.sql`·`023_leading_room_votes.sql`).

🔴 **트릴리언의 Supabase 프로젝트에서 위 테이블/뷰는 전부 그대로 남아 있다** — 이번 STEP은 DB를 건드리지 않았다(코드/문서만). DB를 지울지는 **별도 판정 대상**이다.

## ④ 외부 의존성

- **금융감독원 '파인(FINE)' 유사투자자문업자 신고현황** — `lib/fss.ts`의 `importFssAdvisors()`가 파인 사이트를 페이지네이션(174페이지 순회)으로 수집해 `fss_advisors`에 upsert. 공식 API가 아니라 **페이지 순회 방식**(비공식) — 파인 사이트 구조가 바뀌면 깨질 수 있다.
- 수집을 트리거하던 크론(`app/api/cron/fss-advisors/route.ts`, `Bearer ${CRON_SECRET}` 인증)은 **2026-07-27(STEP794 §5)에 이미 스케줄이 중지**되어 있었다(`vercel.json`에서 제거됨, 라우트 파일만 존재) — 즉 `fss_advisors`는 이 STEP 이전부터 이미 갱신이 멈춰 있었다.
- 국세청 사업자등록 진위확인(업체 클레임 시 `nts_valid` 검증) — `app/api/business/claim` 계열 경로에서 사용되던 것으로 보이나, 실제 외부 API 연동 코드는 이 spinoff 범위 밖(별도 확인 필요 — 클레임 승인 큐에 `nts_valid` 컬럼만 존재하고 이 spinoff 코드 안에서 국세청 API를 직접 호출하는 부분은 발견되지 않음. 관리자가 수기로 확인했을 가능성).

## ⑤ 복원 방법

1. **복원 좌표**: 이 폴더가 추가된 커밋(STEP1035 §1-2, 저장)과 원본이 트릴리언 본체에서 삭제된 커밋(STEP1035 §1-4, 삭제) 두 개의 정확한 해시는 `docs/probe_1035_advisor_spinoff.md`와 `docs/CHANGELOG.md`의 2026-08-15 STEP1035 블록에 기록되어 있다.
2. 이 폴더의 각 파일을 원래 경로(`spinoff/advisor-directory/` 접두어를 뗀 나머지 경로)로 복사.
3. **공유 파일에서 갈라져 나온 부분**은 이 spinoff에 포함되어 있지 않다 — 새 플랫폼에서 아래 로직을 새로 작성해야 한다:
   - `components/toolbox/ToolboxClient.tsx`의 `room` 탭 라우팅(`INFO_ORDER`/`INFO_EXTERNAL`에 `'room'` 포함 + `activeTab === 'room'` 분기).
   - `components/admin/AdminAdInquiries.tsx`의 `SLOT_LABEL.room`/`TEMPLATES.room`(광고 문의 중 "리딩방 게재" 항목).
   - `app/[locale]/advertise/page.tsx` · `components/advertise/AdInquiryForm.tsx`의 `room` 슬롯 옵션(`hasRoom`/`rule2`/`optRoom`).
   - `app/[locale]/admin/page.tsx`의 `claims`/`reports` 탭 구성(이 spinoff의 `AdminBusinessClaims`/`AdminReports`/`AdminFssLookup`을 다시 배선).
4. `spinoff/advisor-directory/i18n-keys.json`에 삭제 당시(ko/en) 문구가 그대로 들어 있다 — 새 플랫폼의 i18n 파일에 병합.
5. DB 스키마는 ③의 표를 참고해 새로 만든다(원본 Supabase 프로젝트를 그대로 재사용할 수 없다면).
6. Supabase Storage 버킷 `business-docs`(업체 클레임 서류 서명 URL 발급에 쓰이던 것, `app/[locale]/admin/page.tsx`에서 `admin.storage.from('business-docs').createSignedUrl(...)` 참고 — 이 spinoff 코드 밖에 있던 로직이므로 새로 구성 필요)도 별도로 준비해야 한다.

## ⑥ 법적 주의사항

- **유사투자자문업 광고 표시의무(2024.8 개정 자본시장법)**: 유사투자자문업자 광고 시 "유사투자자문업자이며 개별 투자상담이 불가함"을 명시해야 하고, 근거 없는 수익률 우위 주장·손실보전/이익보장 표현은 금지된다(위반 시 3년 이하 징역 또는 1억원 이하 벌금). 트릴리언에서는 이 표시의무를 UI로 강제하지 못해 `docs/AD_MONETIZATION_PLAYBOOK.md` §5 KR·§7에서 T5(리딩방 게재)를 **보류** 처리해 두었다 — 재사용하는 플랫폼은 이 표시의무를 실제로 강제하는 UI를 갖추기 전에는 유료 게재를 열지 말 것.
- 유사투자자문업자는 원칙적으로 **단방향 채널만** 허용된다 — 1:1 리딩방 운영은 정식 투자자문업자만 가능. 이 디렉토리는 "신고 여부 조회"이지 "안전 인증"이 아니라는 점을 반드시 화면에 명시해야 한다(기존 문구: `Advisor.notice`/`Footer.disclaimer2` — 안전성·수익성 보증 안 함, 신고 안 된 익명 리딩방 주의).
- "신고"·"인증" 표시가 **안전 보증이 아니라는 점**을 매 화면에서 반복 고지해야 규제·신뢰 리스크가 낮아진다(원 서비스 문구가 이 원칙을 지키고 있었다 — `i18n-keys.json` 참고).
- 이 기능은 **한국(KR) 규제 전제로 설계**되었다 — 다른 국가에서 재사용하려면 그 나라의 유사 규제(투자자문·투자광고 관련 법)를 별도로 확인해야 한다.
