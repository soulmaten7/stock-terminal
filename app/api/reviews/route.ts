import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReviewRow = { id: number; user_id: string; nickname: string | null; rating: number; content: string | null; created_at: string };

// 리뷰 목록 + 평균 + 내가 쓴 것
export async function GET(req: NextRequest) {
  const target_id = (req.nextUrl.searchParams.get("target_id") ?? "").trim().slice(0, 100);
  if (!target_id) return NextResponse.json({ error: "target_id 필요" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("room_reviews")
    .select("id, user_id, nickname, rating, content, created_at")
    .eq("target_id", target_id)
    .eq("status", "visible")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as ReviewRow[];
  const count = rows.length;
  const avg = count ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
  const mineRow = user ? rows.find((r) => r.user_id === user.id) ?? null : null;

  const reviews = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    content: r.content,
    created_at: r.created_at,
    nickname: r.nickname || "익명",
    mine: !!user && r.user_id === user.id,
  }));

  return NextResponse.json({
    reviews,
    avg,
    count,
    mine: mineRow ? { id: mineRow.id, rating: mineRow.rating, content: mineRow.content } : null,
  });
}

// 리뷰 작성/수정 (1인 1리딩방 = upsert)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  let body: { target_id?: string; target_type?: string; rating?: number; content?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }

  const target_id = String(body.target_id ?? "").trim().slice(0, 100);
  const target_type = String(body.target_type ?? "fss_advisor").trim().slice(0, 40);
  const rating = Math.round(Number(body.rating));
  const content = String(body.content ?? "").trim().slice(0, 2000) || null;
  if (!target_id) return NextResponse.json({ error: "target_id 필요" }, { status: 400 });
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: "별점은 1~5" }, { status: 400 });

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const nickname =
    (typeof meta.nickname === "string" && meta.nickname) ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    (user.email ? user.email.split("@")[0] : null);

  const { error } = await supabase
    .from("room_reviews")
    .upsert(
      { target_id, target_type, user_id: user.id, nickname, rating, content, updated_at: new Date().toISOString() },
      { onConflict: "user_id,target_id" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: all } = await supabase
    .from("room_reviews")
    .select("rating")
    .eq("target_id", target_id)
    .eq("status", "visible");
  const ratings = (all ?? []).map((r: { rating: number }) => r.rating);
  const count = ratings.length;
  const avg = count ? Math.round((ratings.reduce((s, x) => s + x, 0) / count) * 10) / 10 : 0;

  return NextResponse.json({ ok: true, avg, count });
}

// 내 리뷰 삭제
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  let body: { id?: number };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "잘못된 값" }, { status: 400 });

  const { error } = await supabase.from("room_reviews").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
