<!-- 2026-07-14 -->
# STEP 710D — i18n 3/3단계 (d, 완결: 로케일 기능 4종)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(로케일 분기 로직 + 로그인 왕복 = 판단·주의 필요. `/clear` 후 시작.)
**목표:** i18n을 "완결"짓는 로케일 인지 기능 4종. 이걸로 **2차 i18n 종료.**
**전제:** STEP 710C 완료(`bacacf7`).

> 4파트는 서로 독립적. **각 파트를 따로 빌드·검증**하고 진행. 파트4(로그인)가 위험하면 **파트1~3만 커밋하고 파트4는 알려달라**(별도로 뺌).

---

## 파트 1 — en → US 시장 탭 디폴트 정렬
사용자 요구: **로케일이 en이면 홈 국가탭이 US 우선**, ko면 KR 우선(현행).
- 홈 국가탭 **순서 + 기본 선택** 로직 찾기(상수 배열 + store 기본값/홈 컴포넌트).
- **최소·안전 해석(이대로 구현):** *로케일의 홈 시장을 맨 앞·기본 선택으로.* en→**US** 먼저·기본, ko→**KR** 먼저·기본(그대로). **나머지 국가는 기존 상대순서 유지.** (전체 재배열은 추후 튜닝 가능 — 지금은 홈 시장만 앞으로.)
- 로케일은 서버=`params.locale`/클라=`useLocale()`로 판별.
- ⚠️ **STEP 703의 보드 뷰 복원**(정렬·페이지 유지) 깨지 말 것 — 로케일 디폴트는 **초기 로드시 기본값**만; 사용자가 세션 중 고른 활성 탭을 덮어쓰면 안 됨.

## 파트 2 — generateMetadata / JSON-LD 로케일화 (709F에서 이월)
- 정적 `export const metadata` → **`generateMetadata`(async)** 로 `app/[locale]/layout.tsx`(+ 필요시 page.tsx). `getTranslations`로 로케일별 title/description.
- `og:locale`: ko→`ko_KR`, en→`en_US`. OG 이미지(`/og.png`)는 유지.
- **hreflang alternates** 추가: `alternates.languages`에 `ko`(`/…`)·`en`(`/en/…`)·`x-default`. (next-intl 권장 방식 문서 확인 후.)
- `app/[locale]/page.tsx`의 **JSON-LD**(Organization/WebSite) `name`·`description`·`inLanguage` 로케일화.
- 메타 문자열이 ko/en.json에 없으면 **양쪽에 키 추가**(예 `Meta.title`·`Meta.description`) → `messages.test.ts` 패리티 유지.

## 파트 3 — youtube 조회수 로케일 나눗셈 (710B 임시값 정리)
`components/toolbox/YoutubeRanking.tsx`(~20줄) — 현재 ko는 `/10000`+`만`, 710B가 en에 어색한 `{v}×10K`를 임시로 넣음.
- **로케일 인지 포맷터**로 교체: ko→`만`(1e4)·`억`(1e8), en→`K`(1e3)·`M`(1e6). 예: 12,000 → ko "1.2만" · en "12K"; 3,400,000 → ko "340만" · en "3.4M".
- 산술 정직하게(반올림 자리 자연스럽게). 임시 `×10K` 키 제거.

## 파트 4 — OAuth 로케일 보존 (710C에서 이월) ⚠️ 로그인 민감
증상: `/en`에서 구글 로그인 → 콜백이 `/`(한국어)로 떨굼.
- 콜백 라우트가 **이미 받는 `next` 파라미터**를 사용해 로케일 포함 복귀 경로 전달(예 `/en/…`). 
- 🔴 **`redirectTo`/Supabase 리다이렉트 허용목록은 절대 건드리지 말 것**(로그인 자체가 죽음 — 710C가 경고한 지점). `next`(앱 내부 상대경로)만으로 처리.
- ⚠️ **로그인 end-to-end 실제 테스트**(ko·en 둘 다): en에서 로그인→`/en`(영어)로 복귀·로그인 성공, ko에서 로그인→`/`(한국어)로 복귀·성공. **로그인 깨지면 즉시 이 파트 롤백.**

## 작업 순서
1. `/clear` 후 시작. 관련 파일 파악(홈 탭 로직·layout metadata·YoutubeRanking·auth callback). next-intl metadata/alternates 공식 방식 확인.
2. 파트1 → 빌드·검증 → 파트2 → 빌드·검증 → 파트3 → 빌드·검증 → 파트4 → **로그인 실측**.
3. 전체 검증: `npm run build` + tsc 0 + vitest. dev(3333):
   - **홈**: `/en` = US 먼저·기본 / `/` = KR 먼저·기본(그대로), 보드 뷰 복원 정상.
   - **메타**: `/en` `<title>`·`og:locale=en_US` 영어 / `/` 한국어·`ko_KR`, hreflang alternates 존재, JSON-LD 로케일별.
   - **youtube**: 조회수 ko `만`/en `K·M` 자연스럽게.
   - **로그인**: ko·en 각각 구글 로그인 왕복 성공 + 로케일 복귀.
   - `IntlError`·MISSING 0, ko에 `/ko` 유출 0.
4. 커밋:
```bash
git add -A && git commit -m "i18n(3/3d·완결): en→US 시장 디폴트 + generateMetadata/JSON-LD 로케일화 + youtube 조회수 로케일 나눗셈 + OAuth 로케일 보존" && git push
```
(파트4 뺐으면 메시지에서 OAuth 제거)

## ⚠️ 실패 시
파트4(로그인)가 제일 위험. 로그인 이상하면 **그 파트만 되돌리고**(또는 `git reset --hard bacacf7` 후 파트1~3만 재적용) 알려줄 것.

## 다음 = 2차 i18n 종료 🎉
- i18n 3단계(708 기반 → 709~709F 문자열 → 710A~D 라우팅·영어·기능) 완결.
- **세션 닫으며 문서 4개 동기화 + CHANGELOG/SESSION_BOOT/NEXT_SESSION** — **Cowork(내) 몫**. Claude Code는 하지 말 것.
- 이후 후보: 라이브에서 6개국 보드·유사투자자문사·/en 전수 육안(710A/C가 못 닿은 클라이언트 뷰) · 다크 폴리시 D · 클로즈드 베타 초대(`docs/BETA_INVITE.md`).
