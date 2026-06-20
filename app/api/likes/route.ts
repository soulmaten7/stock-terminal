import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "login_required" }, { status: 401 });

  let body: { target_id?: string; target_type?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const target_id = String(body.target_id ?? "").trim().slice(0, 100);
  const target_type = String(body.target_type ?? "fss_advisor").trim().slice(0, 40);
  if (!target_id) return NextResponse.json({ error: "target_id 필요" }, { status: 400 });

  const { data: existing } = await supabase
    .from("room_likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("target_id", target_id)
    .maybeSingle();

  let liked: boolean;
  if (existing) {
    await supabase.from("room_likes").delete().eq("id", existing.id);
    liked = false;
  } else {
    await supabase.from("room_likes").insert({ target_id, target_type, user_id: user.id });
    liked = true;
  }

  const { count } = await supabase
    .from("room_likes")
    .select("id", { count: "exact", head: true })
    .eq("target_id", target_id);

  return NextResponse.json({ ok: true, liked, count: count ?? 0 });
}
