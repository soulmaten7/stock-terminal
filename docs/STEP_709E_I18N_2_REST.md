<!-- 2026-07-14 -->
# STEP 709E — i18n 2/3단계 (5군: 유사투자자문사 + 피드/행 컴포넌트)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(709B~709D에서 확인된 함정 재적용 + 공유 dedup 판단)
**목표:** AdvisorDirectory + 피드/행 컴포넌트의 정적 UI 문자열 이관. **한국어 동일·화면 0 변화.**
**전제:** STEP 709D 완료(`17da6fb`).

---

## 대상 (grep으로 실제 목록 확정 후)
- `components/toolbox/AdvisorDirectory.tsx` — 유사투자자문사 디렉토리(뷰 탭 금감원 등록업체·인증 리딩방·관심도순, 검색 placeholder, 출처·주의 안내, 등록·관리 버튼, 빈 상태, 신고 모달, 로그인 안내 등).
- **피드/행 컴포넌트**: `components/toolbox/` 아래 `*Feed.tsx`(News·Macro·Offerings·Dividend 등) + 행류(`ListRow`·`BrokerAdRow`·`AdSlotRow` 등). `grep -rl "'use client'\\|무료\\|바로가기\\|광고" components/toolbox` 등으로 실제 파일 확인.

## 이관 대상 / 제외 / 주의 (709C·709D와 동일 기준)
- **정적 UI만.** props·API 반환·필터/정규식 키·데이터(종목명·업체명·채널명·값)는 **제외**.
- 함정 재적용: ① 모듈 최상위 상수 라벨맵 → 값 키화 + 렌더 `t()` ② 기존 지역 `t` 충돌 리네임 ③ **ICU 아포스트로피** 원문 보존(`createTranslator` 1:1 대조) ④ **데이터 매칭 문자열 번역 금지**(709C F-Score·709D limitBadge 사례처럼 필터·비교에 쓰는 값) ⑤ 공유 문자열 dedup.
- 네임스페이스: "Advisor" + "Feed"(공유) 등 의미 기반.

## 작업
1. grep으로 대상 파일 목록 확정 → 읽기.
2. `messages/ko.json`에 네임스페이스 추가(값 **100% 동일**).
3. `useTranslations`로 정적 문자열 교체(속성 문자열 포함).
4. 빌드+검증: `npm run build` + tsc 0. dev(3333)로 **정보탭 → 유사투자자문사·뉴스 등** 육안 100% 동일, `IntlError`·MISSING_MESSAGE **0**, 사용 키 전부 대조(누락 0).
5. 커밋:
```bash
git add -A && git commit -m "i18n(2/3·정보): AdvisorDirectory·피드/행 컴포넌트 정적 UI → ko.json (동적 제외·dedup·한국어 동일·화면 0)" && git push
```

## 다음
- **709F:** 나머지 페이지 — `about`·`feedback`(FeedbackForm)·`advertise`(AdInquiryForm)·`business`(BusinessClaim·MyBusiness)·`mypage`·`admin/*`·`auth/login`·`terms`·`privacy`·`coin`·`not-found`.
- 그 후 **STEP 710(3/3, 집중 세션):** `app/[locale]` 라우팅 + `en.json` + 언어 스위처 + 로케일→기본 시장 매핑. ← 모든 라우트 이동(최대 변경).
