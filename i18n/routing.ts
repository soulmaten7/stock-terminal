import { defineRouting } from 'next-intl/routing';

// 로케일 라우팅 단일 진실원(SSOT).
// ko(기본) + en. localePrefix:'as-needed' → 기본 로케일(ko)엔 프리픽스가 붙지 않는다.
//   /about  → 내부적으로 /ko/about 으로 리라이트(브라우저 URL은 /about 그대로)
//   /en/about → 영어(messages/en.json)
// 즉 기존 ko URL이 100% 그대로 유지된다.
// STEP 800 §1 — 로케일 정책: **URL이 로케일의 진실원, 명시 선택은 별도 쿠키로 지속.**
//   - localeCookie:false → next-intl이 NEXT_LOCALE을 관리하지 않는다. (next-intl은 URL 방문 때마다 쿠키를
//     현재 URL 로케일로 덮어써서 — syncCookie.js — 지인의 /en 링크 한 번이 지속 선택을 뒤집던 근본 원인.)
//   - localeDetection:false → 프리픽스 없는 경로는 항상 ko(기본)로 해석(쿠키·accept-language 미참조).
//   - 명시 선택(사용자가 언어 버튼으로 고른 것)의 지속은 `Header.switchLocale`이 심는 NEXT_LOCALE(1년) +
//     `proxy.ts`가 "프리픽스 없는 요청 + 선택=en → /en 리다이렉트"로 담당. 그 쿠키는 오직 switchLocale만 바꾼다.
//   - trade-off: 첫 방문 accept-language 자동감지 없음(기본 ko). KR 우선 제품이라 수용 — 영어 사용자는 1회 전환.
export const routing = defineRouting({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
  localePrefix: 'as-needed',
  localeCookie: false,
  localeDetection: false,
});
