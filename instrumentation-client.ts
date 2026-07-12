// Sentry 클라이언트(브라우저) 초기화 — Next 15.3+/16 방식. DSN 미설정 시 no-op.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  enableLogs: true,
});

// 라우터 내비게이션 계측(트레이싱)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
