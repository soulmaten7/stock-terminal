"use client";

// App Router 전역 에러 바운더리 — 렌더링 중 발생한 에러를 Sentry로 캡처.
import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        {/* NextError는 Next 기본 에러 페이지. App Router는 상태코드를 노출하지 않아 0 전달. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
