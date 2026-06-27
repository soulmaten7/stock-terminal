<!-- 2026-06-27 -->
# 리딩방·업체 클레임/관리 설계 (Business Claim & Manage)

> **Phase 2 핵심 수익화 토대.** "금감원 등록 업체가 자기 listing을 찾아 **인증(claim)**하고 자기 리딩방/채널/링크를 **직접 관리**"하는 모델 — Google 비즈니스 프로필 / 네이버 스마트플레이스式.
> 합의 2026-06-27. 정책 출처: `ROADMAP.md` §3 광고·게재 정책.

## 1. 개념 — '신규 등록'이 아니라 '클레임 + 편집'
우리는 금감원 명부(1,804)를 미리 깔아둠 → 대부분 업체는 **이미 listing이 존재.** 그래서 흐름 = 신규생성이 아니라 **찾기 → 인증 → 편집/관리.**

## 2. 데이터 모델 (위임까지 고려 — 처음부터 멤버십 구조)
- **`business_members`** (핵심): `biz_no, user_id, role('owner'|'manager'), status('pending'|'verified'), created_at`
  - `owner` = 인증된 대표 / `manager` = owner가 초대한 직원(링크 추가 가능).
  - ⚠️ 단일 `claimed_by` 필드 금지 — 위임 위해 **처음부터 멤버십 테이블.**
- **`business_links`**: `id, biz_no, type('room'|'youtube'|'site'), platform, url, label, is_paid(bool), expires_at, status, created_by`
  - 1개 무료 + 추가 링크 유료(결제) → `is_paid`/`expires_at`로 관리.
- **`business_listing`** (owner 편집 오버레이): `biz_no, intro, updated_by, updated_at` (사실=fss_advisors 위에 표시용 편집분만).
- **`business_claims`** (인증 증빙): `id, biz_no, user_id, method('doc'|'phone'), doc_url, status('pending'|'approved'|'rejected'), reviewed_by, created_at`

## 3. 화면 흐름 — 전용 '비즈니스 센터' (`/business`)
1. **업체 검색** — 사업자번호/업체명 → 금감원 명부(fss_advisors) 조회 → 본인 업체 선택. (등록된 곳만 = 자동 강제)
2. **클레임 신청** → 대표 인증(4번)
3. **인증** — MVP: 사업자등록증·대표 신분/위임 서류 업로드 → 관리자 확인 / 추후: 휴대폰 본인인증(실명==대표명)
4. **승인 후** — owner가 listing 편집(소개 + 1링크 무료)
5. **위임** — owner가 manager 초대(이메일) → 직원도 링크 추가
6. **다중 링크** — 2번째+ 링크 = 유료(결제) 후 게재 (PG 연동 = 마지막)
- **입구**: AdvisorDirectory '+리딩방 등록' 버튼 + 마이페이지 '내 업체 관리' 링크 → 둘 다 `/business`로.

## 4. 인증 깊이 ('제대로' 박기)
- **MVP = 수동(서류 + 관리자 승인)** — 자동 실명매칭(동명이인·공동대표·퇴임 구멍)보다 **더 엄격.** '제대로'는 여기서 박힘.
- **자동 휴대폰 본인인증** = 규모 최적화(추후 · PG 계약·비용). 실명==대표명은 100% 증명이 아니라 **고신뢰엔 서류 병행.**

## 5. 빌드 순서 (의존성 — 외부계약 필요한 건 뒤로)
1. **DB 테이블** (members / links / listing / claims) + RLS
2. **`/business` 페이지** + 업체검색·클레임 신청
3. **인증** = 서류 업로드 + **관리자 승인 툴**(수동)
4. **owner listing 편집** (소개 + 1링크 무료) → 디렉토리에 반영
5. **위임** (manager 초대)
6. **다중링크 + 결제(PG)** ← 마지막, **법률 자문 후**

> 1~4가 '핵심 골격'(클레임→인증→편집). 5·6은 그 위에 얹는 확장. 외부계약(본인인증·결제 PG)은 5·6에서만 필요 → 지금 안 막힘.

## 6. 정책 연결 (ROADMAP §3)
- 게재 = 금감원 등록 확인된 곳만(자동매칭 OR 관리자 수동확인).
- 미등록 = 게재 불가. 미등록 보호 = 검색 '등록 안 됨·주의' + 신고.
- 결제 붙이기 전 **법률 자문 필수.**

## 7. 현 자산(재사용)
- 자가등록 폼·`/api/rooms/submit`(FSS 대조)·관리자 승인제(STEP 301·363) → 클레임 신청·인증 토대로 흡수/개편.
- `room_submissions` → `business_claims`/`business_members`로 진화.
