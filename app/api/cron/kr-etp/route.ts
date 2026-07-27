import { NextResponse } from "next/server";
import { computeKrEtpSnapshot } from "@/lib/krEtpSnapshot";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const r = await computeKrEtpSnapshot();
    return NextResponse.json(r);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
