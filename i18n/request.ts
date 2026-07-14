import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async () => {
  const locale = 'ko'; // 3단계에서 [locale] 세그먼트로 대체
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
