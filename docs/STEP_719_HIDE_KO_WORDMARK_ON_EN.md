<!-- 2026-07-14 -->
# STEP 719 — 영어 로케일에서 한글 워드마크("트릴리언") 숨김

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
(3곳 조건부 렌더·저위험. Sonnet)
**목표:** `/en`에서 로고 록업의 한글 "트릴리언"을 숨김 → 영어 사이트는 **"Trillion" + 영어 태그라인**만. 한국어(`/`)는 **"Trillion 트릴리언" 병기 그대로**.
**전제:** STEP 718(`72d4f32`). 결정론 데이터 i18n 완료 후 브랜드 록업 폴리시.
**근거:** 710B는 "트릴리언"을 **번역** 안 한 것(옳음·"Trillion Trillion" 방지). 이번은 다른 것 — **en에선 한글 병기를 표시하지 않음**(영어 사용자에겐 무의미·미번역처럼 보임).

---

## 대상 3곳 (사용자 대면 록업)
1. `components/layout/Header.tsx:86` — `<span className="hidden text-sm text-white/45 sm:inline">트릴리언</span>`. `locale`은 이미 있음(`useLocale()` `:22`).
2. `components/layout/Footer.tsx:13` — `Trillion <span className="text-sm font-medium text-white/45">트릴리언</span>`. `import { useLocale } from 'next-intl'` 추가 + `const locale = useLocale()`(서버 컴포넌트에서도 동작).
3. `app/[locale]/auth/login/page.tsx:49` — `Trillion <span ...>{t('brandKo')}</span>`. `'use client'`·`useLocale()` 추가.

## 수정 (셋 다 동일 패턴)
한글 span을 **`{locale === 'ko' && ( ... )}`** 로 감싼다. ko는 그대로, en은 렌더 안 함.
- 예(Header): `{locale === 'ko' && <span className="hidden text-sm text-white/45 sm:inline">트릴리언</span>}`
- Footer·login도 동일하게 한글 span만 조건부.

## 손대지 말 것
- `app/[locale]/page.tsx` JSON-LD `alternateName: ["트릴리언", ...]`(`:51`·`:59`) — **SEO 구조화 데이터의 브랜드 별칭이라 유지**(한글 검색 대응). en에서도 alternateName은 무방.
- `terms`·`privacy`·`admin`·`business`·`coin` 메타의 "트릴리언" — 한국어 페이지/메타라 유지.
- 로그인 로직·brandKo 메시지 값 자체는 불변(조건부 렌더만).

## 검증
1. `npx tsc --noEmit` 0 · `NEXT_DIST_DIR=.next-verify npm run build`(dev 보호).
2. **ko 무회귀**(dev): `/`·`/about`·`/auth/login` 헤더·푸터·로그인 로고 = **"Trillion 트릴리언"** 그대로.
3. **en**: `/en`·`/en/about`·`/en/auth/login` = **"Trillion"만**(트릴리언 없음) + 영어 태그라인.
4. `IntlError` 0.

## 커밋
```bash
git add -A && git commit -m "polish(i18n): en 로케일에서 한글 워드마크 '트릴리언' 숨김 (헤더·푸터·로그인·ko 병기 유지·SEO alternateName 보존)" && git push
```

## 참고
- 이걸로 `/en`의 마지막 한글(로고 병기)도 정리 → en 브랜드 록업 = "Trillion"만.
- (Tier 3 LLM 생성물은 별개 — `docs/TIER3_LLM_I18N_DESIGN.md` 720~723으로 진행 예정.)
