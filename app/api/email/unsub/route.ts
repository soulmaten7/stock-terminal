import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 이메일 모닝 브리핑 원클릭 수신거부(STEP 784) — 로그인 불필요(토큰만). GET=본문 링크 클릭, POST=메일 클라 One-Click(RFC 8058).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function doUnsub(token: string | null) {
  if (!token) return null;
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("email_subscriptions")
    .update({ daily_brief: false, updated_at: new Date().toISOString() })
    .eq("unsub_token", token)
    .select("locale")
    .maybeSingle();
  if (error || !data) return null;
  return data as { locale: string };
}

function page(locale: string, ok: boolean): string {
  const en = locale === "en";
  const title = ok
    ? (en ? "Unsubscribed" : "수신거부 완료")
    : (en ? "Invalid link" : "유효하지 않은 링크");
  const body = ok
    ? (en ? "You will no longer receive the morning brief email. You can turn it back on anytime from My Page." : "모닝 브리핑 이메일 발송을 중단했습니다. 마이페이지에서 언제든 다시 켤 수 있어요.")
    : (en ? "This unsubscribe link is invalid or has expired." : "이 수신거부 링크가 유효하지 않거나 만료됐어요.");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:420px;margin:96px auto;padding:32px;background:#fff;border-radius:12px;text-align:center;">
    <p style="font-size:12px;font-weight:600;color:#2DD4BF;margin:0 0 12px;">Trillion</p>
    <h1 style="font-size:17px;color:#0E1116;margin:0 0 8px;">${title}</h1>
    <p style="font-size:13px;color:#666;line-height:1.6;margin:0;">${body}</p>
  </div>
</body></html>`;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const result = await doUnsub(token);
  return new NextResponse(page(result?.locale ?? "ko", !!result), {
    status: result ? 200 : 404,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// 메일 클라이언트의 원클릭 수신거부(List-Unsubscribe-Post) — 사용자 상호작용 없이 호출되므로 HTML 대신 빈 200만.
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const result = await doUnsub(token);
  return new NextResponse(null, { status: result ? 200 : 404 });
}
