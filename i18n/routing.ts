import { defineRouting } from 'next-intl/routing';

// 로케일 라우팅 단일 진실원(SSOT).
// ko(기본) + en. localePrefix:'as-needed' → 기본 로케일(ko)엔 프리픽스가 붙지 않는다.
//   /about  → 내부적으로 /ko/about 으로 리라이트(브라우저 URL은 /about 그대로)
//   /en/about → 영어(messages/en.json)
// 즉 기존 ko URL이 100% 그대로 유지된다.
// STEP 800 §1 — 로케일 정책: **URL이 로케일의 진실원, 명시 선택은 별도 쿠키로 지속.**
//   - localeCookie:false → next-intl이 NEXT_LOCALE을 관리하지 않는다. (next-intl은 URL 방문 때마다 쿠키를
//     현재 URL 로케일로 덮어써서 — syncCookie.js — 지인의 /en 링크 한 번이 지속 선택을 뒤집던 근본 원인.)
//   - localeDetection:false → next-intl 자체 감지는 끔(next-intl이 매 방문마다 재판단하는 걸 원치 않음).
//     자동감지 자체는 2026-09-06부터 `proxy.ts`가 직접, 아래 규칙으로 한다(상세 주석은 그 파일):
//     명시 선택(locale_choice)이 최우선 → 없으면 이미 자동감지해봤는지(locale_auto 쿠키) 확인 →
//     둘 다 없는 **진짜 첫 방문에만**, 봇이 아닌 경우에 한해 Accept-Language를 한 번 보고 못박는다.
//   - 명시 선택(사용자가 언어 버튼으로 고른 것)의 지속은 `Header.switchLocale`이 심는 locale_choice(1년,
//     레거시 NEXT_LOCALE 아님 — STEP 806 §5로 교체) + `proxy.ts`가 "프리픽스 없는 요청 + 선택=en →
//     /en 리다이렉트"로 담당. 그 쿠키는 오직 switchLocale만 바꾼다 — 자동감지는 이 쿠키를 절대 건드리지
//     않는다(별도 쿠키 locale_auto만 씀), 그래서 자동감지가 명시 선택을 덮어쓸 수 없다.
export const routing = defineRouting({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
  localePrefix: 'as-needed',
  localeCookie: false,
  localeDetection: false,
});
