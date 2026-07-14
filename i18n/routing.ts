import { defineRouting } from 'next-intl/routing';

// 로케일 라우팅 단일 진실원(SSOT).
// 지금은 ko 하나 + localePrefix:'as-needed' → 기본 로케일(ko)엔 프리픽스가 붙지 않는다.
//   /about → 내부적으로 /ko/about 으로 리라이트(브라우저 URL은 /about 그대로)
// 즉 기존 URL이 100% 그대로 유지된다. 'en'은 710B에서 여기 locales에 추가.
export const routing = defineRouting({
  locales: ['ko'],
  defaultLocale: 'ko',
  localePrefix: 'as-needed',
});
