import { NextResponse } from "next/server";
import { getIndices } from "@/lib/indices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 조회 로직은 lib/indices.ts로 이전(STEP 771 §3) — 서버 프리페치(app/[locale]/page.tsx)와 공용, 내부 HTTP 왕복 없이 직접 호출.
export async function GET() {
  return NextResponse.json(await getIndices());
}
