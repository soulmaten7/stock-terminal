import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ⚠️ 임시 Sentry 검증용 라우트 — 호출 시 의도적으로 에러를 던져 Sentry(onRequestError)가
//    실제로 잡는지 확인하는 용도. 검증 끝나면 이 파일을 삭제할 것.
export async function GET() {
  throw new Error("Sentry 검증용 테스트 에러 (trillion) — 확인되면 이 라우트 삭제");
  // eslint-disable-next-line no-unreachable
  return NextResponse.json({ ok: true });
}
