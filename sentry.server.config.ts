// Sentry 서버(Node.js 런타임) 초기화 — instrumentation.ts 의 register()가 import.
// NEXT_PUBLIC_SENTRY_DSN 미설정 시 no-op(안전). 활성화하려면 해당 env 설정.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  enableLogs: true,
});
