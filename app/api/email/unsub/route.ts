import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// 이메일 모닝 브리핑 수신거부(STEP 784) — 로그인 불필요(토큰만).
// STEP 793: GET은 부수효과 제거 — 확인 페이지만 보여주고, 실제 해제는 그 버튼의 POST에서만.
//   (메일 클라이언트·보안 게이트웨이의 링크 프리페치가 GET 한 번으로 사용자 의사 없이 해제시키던 버그.)
//   POST = 확인 버튼(폼) + 메일 클라 원클릭(List-Unsubscribe-Post·RFC 8058) 둘 다 처리(멱등).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 토큰으로 로케일만 읽음(부수효과 없음) — GET 확인 페이지 렌더·유효성 판단용.
async function lookupLocale(token: string | null): Promise<{ locale: string } | null> {
  if (!token) return null;
  const sb = createAdminClient();
  const { data } = await sb
    .from("email_subscriptions")
    .select("locale")
    .eq("unsub_token", token)
    .maybeSingle();
  return data ? (data as { locale: string }) : null;
}

// 실제 수신거부(멱등) — POST에서만. 이미 해제된 토큰이어도 행이 있으면 성공 처리.
async function doUnsub(token: string | null): Promise<{ locale: string } | null> {
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

const SHELL = (title: string, inner: string) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:420px;margin:96px auto;padding:32px;background:#fff;border-radius:12px;text-align:center;">
    <p style="font-size:12px;font-weight:600;color:#2DD4BF;margin:0 0 12px;">Trillion</p>
    ${inner}
  </div>
</body></html>`;

// GET 확인 페이지 — 실제 해제는 이 폼의 POST에서만 일어남(프리페치는 GET이라 무해).
function confirmPage(locale: string, token: string): string {
  const en = locale === "en";
  const title = en ? "Unsubscribe" : "수신거부";
  const q = en
    ? "Do you want to stop receiving the morning brief email?"
    : "모닝 브리핑 이메일 수신을 중단하시겠어요?";
  const btn = en ? "Unsubscribe" : "수신거부";
  const action = `/api/email/unsub?token=${encodeURIComponent(token)}`;
  const inner = `<h1 style="font-size:17px;color:#0E1116;margin:0 0 16px;">${title}</h1>
    <p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 20px;">${q}</p>
    <form method="post" action="${action}">
      <button type="submit" style="display:inline-block;padding:10px 28px;background:#0E1116;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">${btn}</button>
    </form>`;
  return SHELL(title, inner);
}

// 해제 결과(성공/유효하지 않음).
function resultPage(locale: string, ok: boolean): string {
  const en = locale === "en";
  const title = ok
    ? (en ? "Unsubscribed" : "수신거부 완료")
    : (en ? "Invalid link" : "유효하지 않은 링크");
  const body = ok
    ? (en ? "You will no longer receive the morning brief email. You can turn it back on anytime from My Page." : "모닝 브리핑 이메일 발송을 중단했습니다. 마이페이지에서 언제든 다시 켤 수 있어요.")
    : (en ? "This unsubscribe link is invalid or has expired." : "이 수신거부 링크가 유효하지 않거나 만료됐어요.");
  const inner = `<h1 style="font-size:17px;color:#0E1116;margin:0 0 8px;">${title}</h1>
    <p style="font-size:13px;color:#666;line-height:1.6;margin:0;">${body}</p>`;
  return SHELL(title, inner);
}

// GET = 확인 페이지만(부수효과 없음). 토큰이 실제 구독을 가리키면 확인 버튼, 아니면 유효하지 않음 안내.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const sub = await lookupLocale(token);
  if (!sub) {
    return new NextResponse(resultPage("ko", false), {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  return new NextResponse(confirmPage(sub.locale, token as string), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// POST = 실제 해제. 확인 버튼(브라우저 폼·Accept: text/html) → 결과 페이지, 메일 클라 원클릭(RFC 8058) → 빈 200.
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const result = await doUnsub(token);
  const wantsHtml = (req.headers.get("accept") || "").includes("text/html");
  if (wantsHtml) {
    return new NextResponse(resultPage(result?.locale ?? "ko", !!result), {
      status: result ? 200 : 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  return new NextResponse(null, { status: result ? 200 : 404 });
}
