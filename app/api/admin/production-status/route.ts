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

// 필터: country(KR|US) · type(report|growth_story) · unuploaded(1이면 status!='업로드됨'만) · from/to(assembled_date 범위)
// 🔴 2026-09-08 정정 — 정렬·범위 필터 기준을 target_date(콘텐츠 자체의 기준일:
// 리포트 발행일·성장스토리 사업보고서 제출일)에서 assembled_date(실제 조립일)로
// 바꿨다. target_date 기준으로 정렬하면 성장스토리(제출일이 3월 등 훨씬 과거)가
// 최신 목록에서 다 밀려 사라지는 문제가 있었다 — 상세는 migration
// 20260908d_production_items_assembled_date.sql 참고.
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const country = sp.get("country");
  const type = sp.get("type");
  const unuploaded = sp.get("unuploaded") === "1";
  const from = sp.get("from");
  const to = sp.get("to");

  const admin = createAdminClient();
  let q = admin.from("production_items").select("*").order("assembled_date", { ascending: false }).order("id", { ascending: false }).limit(300);
  if (country) q = q.eq("country", country);
  if (type) q = q.eq("content_type", type);
  if (unuploaded) q = q.neq("status", "업로드됨");
  if (from) q = q.gte("assembled_date", from);
  if (to) q = q.lte("assembled_date", to);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

// 🔴 2026-09-08 신설 — 롱폼(한국판 일일 합본)은 쇼츠 여러 편을 묶은 것이라
// 종목 하나로 특정이 안 되고, 지금은 채널이 EarthTicker에 아예 적재하지
// 않는다(채널 쪽 자동 연동은 스코프 밖). channel_reports/channel_growth_
// stories 같은 자동 트리거 소스가 없으므로, admin이 수동으로 한 줄 추가
// 하는 것까지만 이번에 준비한다 — 나중에 채널 쪽이 자동 적재를 붙이면
// 이 수동 입력 경로는 자연히 덜 쓰이게 된다(막을 필요 없음).
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  let body: { country?: string; title?: string; symbols?: string; assembled_date?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "잘못된 요청" }, { status: 400 }); }

  const country = body.country === "US" ? "US" : "KR";
  const title = String(body.title ?? "").trim().slice(0, 200);
  if (!title) return NextResponse.json({ error: "제목을 입력해 주세요" }, { status: 400 });

  const bundledSymbols = String(body.symbols ?? "")
    .split(/[,·]/).map((s) => s.trim()).filter(Boolean);
  const stockName = bundledSymbols.length ? bundledSymbols.join(" · ") : title;
  const assembledDate = body.assembled_date || new Date().toISOString().slice(0, 10);

  const admin = createAdminClient();
  const { error } = await admin.from("production_items").insert({
    country, content_type: "longform", symbol: null, stock_name: stockName,
    target_date: assembledDate, assembled_date: assembledDate, title,
    bundled_symbols: bundledSymbols.length ? bundledSymbols : null,
    status: "조립됨",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
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
