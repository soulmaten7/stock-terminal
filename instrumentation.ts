// Next.js instrumentation — 런타임별 Sentry 서버/엣지 설정 로드 + 서버 에러 캡처.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// 서버 컴포넌트·미들웨어·라우트 핸들러의 에러 캡처
export const onRequestError = Sentry.captureRequestError;
