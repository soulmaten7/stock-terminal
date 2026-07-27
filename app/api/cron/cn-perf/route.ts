import { NextResponse } from "next/server";
import { computeCnPerf } from "@/lib/cnPerf";

export const maxDuration = 300; // 중화권 종목 chart 계산 여유(동시 12)
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const r = await computeCnPerf();
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
