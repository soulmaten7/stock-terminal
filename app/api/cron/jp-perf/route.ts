import { NextResponse } from "next/server";
import { computeJpPerf } from "@/lib/jpPerf";

export const maxDuration = 300; // ~6,121종목 chart 계산 여유(동시 12 → ~3분)
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const r = await computeJpPerf();
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
