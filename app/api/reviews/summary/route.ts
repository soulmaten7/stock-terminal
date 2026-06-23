import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 여러 리딩방의 평균별점·리뷰수를 한 번에 (리스트 배지용)
export async function GET(req: NextRequest) {
  const raw = (req.nextUrl.searchParams.get("ids") ?? "").trim();
  if (!raw) return NextResponse.json({ summary: {} });
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 200);
  if (ids.length === 0) return NextResponse.json({ summary: {} });

  const supabase = await createClient();
  const { data } = await supabase
    .from("room_reviews")
    .select("target_id, rating")
    .in("target_id", ids)
    .eq("status", "visible");

  const acc: Record<string, { sum: number; count: number }> = {};
  for (const r of (data ?? []) as { target_id: string; rating: number }[]) {
    (acc[r.target_id] ??= { sum: 0, count: 0 });
    acc[r.target_id].sum += r.rating;
    acc[r.target_id].count += 1;
  }
  const summary: Record<string, { avg: number; count: number }> = {};
  for (const [k, v] of Object.entries(acc)) {
    summary[k] = { avg: Math.round((v.sum / v.count) * 10) / 10, count: v.count };
  }
  return NextResponse.json({ summary });
}
