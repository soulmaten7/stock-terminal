import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// EDINET 원문(PDF) 프록시 — 키를 서버측에 숨긴 채 문서를 스트리밍. type=2 = PDF.
// 종목 페이지 JpEventLayer의 '원문 보기' 링크가 여기로.
const BASE = "https://api.edinet-fsa.go.jp/api/v2";

export async function GET(req: NextRequest) {
  const key = (process.env.EDINET_API_KEY || "").trim();
  const docid = (req.nextUrl.searchParams.get("docid") || "").trim();
  if (!key) return NextResponse.json({ error: "no_key" }, { status: 500 });
  if (!/^[A-Za-z0-9]+$/.test(docid)) return NextResponse.json({ error: "bad_docid" }, { status: 400 });

  const url = `${BASE}/documents/${docid}?type=2&Subscription-Key=${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(25000) });
    if (!res.ok) return NextResponse.json({ error: "fetch_failed", status: res.status }, { status: 502 });
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${docid}.pdf"`,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "timeout" }, { status: 504 });
  }
}
