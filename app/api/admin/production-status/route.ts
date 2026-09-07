import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabase.from("users").select("role").eq("id", user.id).single();
  return me?.role === "admin" ? user : null;
}

// 필터: country(KR|US) · type(report|growth_story) · unuploaded(1이면 status!='업로드됨'만) · from/to(target_date 범위)
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const country = sp.get("country");
  const type = sp.get("type");
  const unuploaded = sp.get("unuploaded") === "1";
  const from = sp.get("from");
  const to = sp.get("to");

  const admin = createAdminClient();
  let q = admin.from("production_items").select("*").order("target_date", { ascending: false }).limit(300);
  if (country) q = q.eq("country", country);
  if (type) q = q.eq("content_type", type);
  if (unuploaded) q = q.neq("status", "업로드됨");
  if (from) q = q.gte("target_date", from);
  if (to) q = q.lte("target_date", to);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  let body: { id?: number; uploaded?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }
  const id = Number(body.id);
  if (!id || typeof body.uploaded !== "boolean") return NextResponse.json({ error: "잘못된 값" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("production_items").update(
    body.uploaded ? { status: "업로드됨", uploaded_at: new Date().toISOString() } : { status: "조립됨", uploaded_at: null }
  ).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
