import { defineRouting } from 'next-intl/routing';

// 로케일 라우팅 단일 진실원(SSOT).
// ko(기본) + en. localePrefix:'as-needed' → 기본 로케일(ko)엔 프리픽스가 붙지 않는다.
//   /about  → 내부적으로 /ko/about 으로 리라이트(브라우저 URL은 /about 그대로)
//   /en/about → 영어(messages/en.json)
// 즉 기존 ko URL이 100% 그대로 유지된다.
export const routing = defineRouting({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
  localePrefix: 'as-needed',
});
