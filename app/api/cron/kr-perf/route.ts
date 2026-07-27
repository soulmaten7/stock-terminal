import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { computeKrSnapshot } from "@/lib/krSnapshot";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const r = await computeKrSnapshot();
    return NextResponse.json(r);
  } catch (e) {
    Sentry.captureException(e, { tags: { pipeline: "kr_perf" } });
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
