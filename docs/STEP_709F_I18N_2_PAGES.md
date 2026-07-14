<!-- 2026-07-14 -->
# STEP 709F — i18n 2/3단계 (6군, 마지막: 나머지 사용자 대면 페이지)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(⚠️ 이 군에 **처음으로 서버 컴포넌트**가 섞임 → API가 다름. + 무엇을 제외할지 판단 필요)
**목표:** 남은 **사용자 대면** 페이지의 정적 UI 문자열 이관. **한국어 동일·화면 0 변화.** 이걸로 2/3단계(문자열 이관) 사실상 종료.
**전제:** STEP 709E 완료(`0d4017b`).

---

## ⚠️ 이번 군의 핵심 판단 ① — 서버 vs 클라이언트 컴포넌트 (API 다름)
709B~709E는 전부 `'use client'`라 `useTranslations`만 썼음. 이번엔 서버 컴포넌트가 섞임:
- **클라이언트(`'use client'` 있음):** `useTranslations('NS')` — 지금까지와 동일.
- **서버(`'use client'` 없음):** `import { getTranslations } from 'next-intl/server'` → `const t = await getTranslations('NS')`. **컴포넌트를 `async`로** 바꿔야 함(안 그러면 await 못 씀). 파일 맨 위 `'use client'` 유무로 판별.

## ⚠️ 핵심 판단 ② — 일부러 제외 (누락 아님, 의도된 결정)
아래는 **이번에도, 앞으로도 ko.json으로 안 옮긴다**. 근거를 남김:
- **`app/admin/*` (관리자 전 페이지):** 운영진 전용·외부 미노출. 영어 전환 대상이 절대 아님 → 옮길 실익 0, 리스크만↑. **한국어 하드코딩 그대로 둔다.**
- **`app/terms`·`app/privacy` (약관·개인정보):** 관할(한국법) 종속 법률 문서. US는 "번역"이 아니라 **다른 문서**가 필요 → JSON에 넣어 기계번역할 대상이 아님. **한국어 그대로 둔다.** (US 오픈 시 별도 EN 법률문서로 처리.)

## 대상 (사용자 대면 — 이관)
grep로 실제 파일 확정 후:
- `app/about/page.tsx` — **서버 컴포넌트.** 모듈 상수 `PILLARS`(t/d 배열)는 709B식 **값 키화 + 렌더 `t()`**, 컴포넌트 `async`+`getTranslations`. "이렇게 봅니다" 3스텝, 멍거 인용, 하단 disclaimer 포함.
- `components/**/FeedbackForm*` (피드백) · `components/**/AdInquiryForm*`(광고 문의) — 클라이언트. **AdInquiryForm의 SelectDropdown placeholder는 709E에서 만든 `select` 키 재사용**(중복 키 만들지 말 것).
- `business` — `BusinessClaimClient`·`MyBusinessClient`(클라이언트).
- `mypage` 관련 클라이언트 · `auth/login` · `not-found`(서버) · `coin`(있으면) 등 **사용자 대면 나머지.**

## 제외 (동적) — 지금까지와 동일
props·API 반환·데이터·필터/정규식 키·**DB로 가는 값**(709E 신고 사유 계열). 종목명·업체명·상태값 등은 그대로.

## ⚠️ 함정 재적용 (709B~709E 전부)
① 모듈 상수 라벨/배열 → 값 키화 + `t()`  ② 지역 `t` 충돌 리네임  ③ **ICU 아포스트로피** 원문 보존(`createTranslator` 1:1 대조)  ④ **데이터/DB 매칭 문자열 번역 금지**  ⑤ 공유 문자열 dedup(‘저장’·‘취소’·‘문의하기’ 등 반복 → 기존 Common/Feed 키 재사용).

## 작업
1. grep로 대상 확정(+ `'use client'` 유무 판별) → 읽기.
2. `messages/ko.json`에 네임스페이스 추가(값 **100% 동일**). 반복 문자열은 기존 키 재사용.
3. 서버=`getTranslations`(async)/클라=`useTranslations`로 교체(속성 문자열 포함).
4. 빌드+검증: `npm run build` + tsc 0. dev(3333)로 **소개·피드백·광고문의·로그인·비즈니스·마이페이지** 육안 100% 동일, `IntlError`·MISSING_MESSAGE **0**, 사용 키 전부 대조(누락 0). **admin·terms·privacy는 한국어 그대로인지(안 건드렸는지) 확인.**
5. 커밋:
```bash
git add -A && git commit -m "i18n(2/3·페이지): 사용자 대면 나머지 페이지 정적 UI → ko.json (서버=getTranslations·admin/약관 의도적 제외·한국어 동일·화면 0)" && git push
```

## 다음 = 2/3단계 종료 → **STEP 710 (3/3, 집중 세션)**
`app/[locale]` 라우팅 재구성 + `routing.ts`/`navigation.ts` + `generateStaticParams`/`setRequestLocale` + `en.json`(ko 키 전부 영어로) + 언어 스위처(헤더) + **로케일→기본 시장 매핑**(en→US 우선 정렬). ← 모든 라우트 이동이라 가장 큰 변경, 새 세션에서 집중.
