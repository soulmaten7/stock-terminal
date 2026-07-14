<!-- 2026-07-14 -->
# STEP 713 — 나머지 `[locale]` 페이지 stale 캐시 일괄 수정 (force-dynamic)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
(11개 파일에 동일한 1줄 추가 — 기계적·저위험. Sonnet)
**목표:** STEP 712(종목 페이지)와 **같은 무한 캐시 버그**가 나머지 `[locale]` 페이지에도 있음 → 전부 `force-dynamic`으로 신선 보장. **브랜드(/about)·법무(/terms·/privacy) stale 제거.**
**전제:** STEP 712(`2cd926d`). 다른 `[locale]` 페이지 stale 스윕 중 발견.

---

## 🔬 진단 (라이브 web_fetch + 코드 대조로 확정)
- `app/[locale]/about/page.tsx` **코드는 현재값**(i18n `getTranslations('About')` + `pillar.armT/seeT/ownT` = 기관급 분석·정직한 데이터·당신의 판단) — 그런데 **라이브 `/about`은 브랜드 개편 이전** 서빙: "정확한 정보·검증된 신뢰"(옛 기둥)·"속지 않도록 돕는"·"흩어진 금융정보"(폐기 프레임)·옛 keywords. → **깊은 stale 캐시 확정**(2026-07-10 이전).
- **원인 = STEP 712와 동일**: `app/[locale]/layout.tsx`가 `setRequestLocale`+`generateStaticParams`로 정적 렌더를 켜는데, 페이지에 `dynamic`/`revalidate` 지시자가 없으면 **정적 캐시로 굳고 배포해도 안 갈아엎어짐**. 종목 페이지만의 문제가 아니라 **지시자 없는 모든 `[locale]` 페이지**가 위험.
- `/coin`은 신선"해 보이나" 내용이 원래 안 바뀌어서일 뿐(캐시는 동일하게 굳음). **/terms·/privacy는 2026-07-12 법무 정확화**(구글만·시행일·분쟁조정 구제)가 있어 stale이면 **규제 리스크.**

## ✅ 수정 — 아래 11개 파일에 `force-dynamic` 추가
각 파일 상단(import/기존 `export const` 아래, 컴포넌트 위)에 추가:
```ts
export const dynamic = "force-dynamic";
```
- **이미 있는 페이지엔 손대지 말 것**(home·business·admin·stock/[symbol]은 이미 force-dynamic).
- `runtime`이 이미 있으면 중복 추가 금지(예 advertise는 `runtime = "nodejs"` 이미 있음 → `dynamic`만 추가). 없어도 굳이 runtime 추가 불필요(default nodejs).
- **본문·metadata·로직은 절대 건드리지 말 것** — 오직 캐시 지시자 1줄.

**대상 11개** (`grep -L "force-dynamic\|revalidate"` 로 교차 확인):
1. `app/[locale]/about/page.tsx` ← 최우선(브랜드 stale 확정)
2. `app/[locale]/terms/page.tsx` ← 법무
3. `app/[locale]/privacy/page.tsx` ← 법무
4. `app/[locale]/toolbox/page.tsx`
5. `app/[locale]/coin/page.tsx`
6. `app/[locale]/favorites/page.tsx`
7. `app/[locale]/mypage/page.tsx`
8. `app/[locale]/feedback/page.tsx`
9. `app/[locale]/advertise/page.tsx` (`dynamic`만 — runtime 이미 있음)
10. `app/[locale]/auth/login/page.tsx`
11. `app/[locale]/admin/login/page.tsx`

## 검증
1. `npm run build` — 위 11개 라우트가 `ƒ (Dynamic)`로 표시(전엔 `○`/`●` 정적). tsc 0·vitest.
2. **배포 후 라이브**(web_fetch·캐시버스터 없이):
   - `https://onetrillion.app/about` → **기관급 분석·정직한 데이터·당신의 판단** + i18n 슬로건·'이렇게 봅니다' 3스텝·멍거 인용(개편 후 본문). "속지 않도록"·"흩어진 금융정보" **사라짐**.
   - `https://onetrillion.app/terms`·`/privacy` → 현재 법무 텍스트(구글만·시행일 2026-07-11·분쟁조정 구제).
   - `https://onetrillion.app/en/about` → 영어 기둥(Institutional-grade analysis·Honest data·Your judgment).
   - 스팟: `/coin`·`/toolbox` 헤더·푸터 현재값.
3. 홈·보드·종목상세(712) 무영향.

## 커밋
```bash
git add -A && git commit -m "fix: 나머지 [locale] 페이지 11개 force-dynamic — 무한 캐시 stale 제거 (about 개편전 브랜드·terms/privacy 법무정확화전 서빙되던 것 수정)" && git push
```

## 참고 (근본 메모)
- 근본 = `[locale]` 레이아웃 정적 렌더 자격 + 페이지 캐시 지시자 누락 + 배포가 정적 캐시를 무효화 안 함의 조합. `force-dynamic`은 프로젝트 기존 패턴(home·business·admin)과 동일한 **신뢰성 있는 대증 수정.**
- (선택·후속) "정적 페이지가 왜 배포 때 갱신 안 되나"의 Vercel 레벨 원인(엣지 캐시 s-maxage·미들웨어 등) 규명은 별도. 지금은 신선도 확실성 우선.
- **교훈 = CLAUDE.md/플레이북 후보**: 새 `[locale]` 페이지는 **캐시 지시자를 명시**(정적이어도 최소 `revalidate`)하지 않으면 무한 stale 위험.
