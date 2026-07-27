import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTodayChanges, type ChangeItemData } from "@/lib/todayChanges";
import { getLatestDailyBrief } from "@/lib/dailyBrief";
import { resolveDisplayName } from "@/lib/displayName";
import { lensDisplayName, lensStateLabel } from "@/lib/lensCopy";
import { groupBySymbol } from "@/lib/groupChanges";

// 이메일 모닝 브리핑(opt-in·STEP 784) — daily-brief(21:00 UTC) 뒤 22:15 UTC 1일 1회. 새 LLM 콜 없음(전부 기존 산출물 재조립).
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

type Locale = "ko" | "en";
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://onetrillion.app";
const FROM = "Trillion <brief@onetrillion.app>";
const FRESH_H = 20; // daily_brief가 이 시간 이내로 생성됐어야 "오늘자"로 인정(오래된 걸로 메일 보내지 않음)

function isFresh(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < FRESH_H * 3600 * 1000;
}

function subjectFor(locale: Locale, at: Date): string {
  return locale === "en"
    ? `Today's one-bite brief · ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(at)}`
    : `오늘의 한 입 브리핑 · ${new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(at)}`;
}

type MoverLine = { name: string; lensName: string; from: string; to: string; extra: number };

function movers(items: (ChangeItemData & { market: "KR" | "US" })[], loc: Locale): MoverLine[] {
  const sorted = [...items].sort((a, b) => (b.tradeAmount ?? 0) - (a.tradeAmount ?? 0));
  return groupBySymbol(sorted).slice(0, 5).map(({ item, extra }) => ({
    name: resolveDisplayName({ loc, market: item.market, symbol: item.symbol, nameKo: item.nameKo, nameEn: item.nameEn, rawName: item.name, context: "list" }),
    lensName: lensDisplayName(loc, item.lensKey),
    from: item.fromState ? lensStateLabel(loc, item.lensKey, item.fromState) : "—",
    to: lensStateLabel(loc, item.lensKey, item.toState),
    extra,
  }));
}

// 다크 강제 금지 — 이메일 클라 호환 우선(인라인 스타일만, 민트 포인트만). 화면 톤·문법 재사용(사실만·판단은 당신).
function renderHtml(params: { loc: Locale; briefText: string; moverLines: MoverLine[]; unsubToken: string }): string {
  const { loc, briefText, moverLines, unsubToken } = params;
  const en = loc === "en";
  const homeUrl = `${SITE_BASE}${en ? "/en" : ""}/`;
  const unsubUrl = `${SITE_BASE}/api/email/unsub?token=${unsubToken}`;
  const moversHtml = moverLines.length
    ? moverLines.map((m) => `
        <tr>
          <td style="padding:6px 0;font-size:14px;color:#0E1116;border-bottom:1px solid #eee;">
            <strong>${m.name}</strong>
            <span style="color:#666;"> — ${m.lensName} ${m.from} → ${m.to}${m.extra > 0 ? (en ? ` (+${m.extra} more)` : ` (외 ${m.extra}건)`) : ""}</span>
          </td>
        </tr>`).join("")
    : `<tr><td style="padding:6px 0;font-size:14px;color:#666;">${en ? "No changes among your watchlist today." : "오늘은 관심종목에 상태 전환이 없었어요."}</td></tr>`;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:480px;">
          <tr><td style="padding:20px 24px;border-bottom:2px solid #2DD4BF;">
            <span style="font-size:16px;font-weight:700;color:#0E1116;">Trillion</span>
            <span style="font-size:12px;color:#2DD4BF;margin-left:6px;">${en ? "TR-AI Lens" : "TR-AI 렌즈"}</span>
          </td></tr>
          <tr><td style="padding:20px 24px 8px;">
            <p style="font-size:11px;font-weight:600;color:#888;margin:0 0 6px;">${en ? "ONE-BITE BRIEFING" : "한 입 브리핑"}</p>
            <p style="font-size:15px;line-height:1.6;color:#0E1116;margin:0;">${briefText}</p>
          </td></tr>
          <tr><td style="padding:12px 24px 4px;">
            <p style="font-size:11px;font-weight:600;color:#888;margin:0 0 6px;border-top:1px solid #eee;padding-top:16px;">${en ? "YOUR WATCHLIST — TODAY" : "내 관심종목 · 오늘 변화"}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${moversHtml}</table>
          </td></tr>
          <tr><td style="padding:20px 24px;">
            <a href="${homeUrl}" style="display:inline-block;background:#0E1116;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;padding:10px 18px;border-radius:8px;">${en ? "Open today's screen →" : "오늘 화면 열기 →"}</a>
          </td></tr>
          <tr><td style="padding:16px 24px;border-top:1px solid #eee;">
            <p style="font-size:11px;color:#999;margin:0 0 4px;">${en ? "Facts only — the judgment is yours." : "사실만 · 판단은 당신"}</p>
            <p style="font-size:11px;color:#999;margin:0;"><a href="${unsubUrl}" style="color:#999;">${en ? "Unsubscribe" : "수신거부"}</a></p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    Sentry.captureMessage("[email-brief] RESEND_API_KEY missing", "error");
    return NextResponse.json({ ok: false, error: "no_key" }, { status: 500 });
  }
  const sb = createAdminClient();

  // 하트비트: 이 크론이 실제로 실행됐음을 기록(헬스체크가 나이 감시 — 조용한 미실행 검출·STEP 794). best-effort.
  try { await sb.from("cron_heartbeats").upsert({ job: "email-brief", last_run_at: new Date().toISOString(), ok: true }); } catch { /* 하트비트 실패는 비치명 */ }

  // 1) 오늘자 daily_brief(KR·US) — 신선하지 않으면(예: 상류 크론 실패) 그 로케일은 지어내지 않고 스킵.
  const [krBrief, usBrief] = await Promise.all([getLatestDailyBrief("KR"), getLatestDailyBrief("US")]);
  const briefFor: Record<Locale, string | null> = {
    ko: krBrief && isFresh(krBrief.created_at) ? krBrief.text_ko : null,
    en: usBrief && isFresh(usBrief.created_at) ? usBrief.text_en : null,
  };
  if (!briefFor.ko && !briefFor.en) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no_fresh_brief" });
  }

  // 2) 구독자
  const { data: subs, error: subErr } = await sb.from("email_subscriptions").select("user_id,locale,unsub_token").eq("daily_brief", true);
  if (subErr) {
    Sentry.captureMessage(`[email-brief] subscriber query failed: ${subErr.message}`, "error");
    return NextResponse.json({ ok: false, error: subErr.message }, { status: 500 });
  }
  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no_subscribers" });
  }

  // 3) 관심종목 전환(776 그룹핑 문법 재사용) — 시장당 한 번만 조회 후 사용자별로 로컬 필터(구독자 N명이어도 DB 왕복은 2회).
  // 관심종목은 사용자 로케일과 무관하게 KR·US 어느 시장이든 담을 수 있어 둘 다 필요.
  const [krChanges, usChanges] = await Promise.all([
    getTodayChanges({ market: "KR", limit: 2000 }),
    getTodayChanges({ market: "US", limit: 2000 }),
  ]);

  // 구독자 1000명 초과 시 .in()이 조용한 400(URL 초과) → 전원 "변화 없음" 메일. 1000청크로 방어(STEP 794 §8).
  const userIds = subs.map((s) => s.user_id);
  const wlRows: { user_id: string; symbol: string; country: string }[] = [];
  for (let i = 0; i < userIds.length; i += 1000) {
    const { data } = await sb.from("watchlist").select("user_id,symbol,country").in("user_id", userIds.slice(i, i + 1000));
    if (data) wlRows.push(...(data as { user_id: string; symbol: string; country: string }[]));
  }
  const wlByUser = new Map<string, { kr: Set<string>; us: Set<string> }>();
  for (const w of wlRows) {
    const entry = wlByUser.get(w.user_id) ?? { kr: new Set<string>(), us: new Set<string>() };
    if (w.country === "KR") entry.kr.add(w.symbol);
    else if (w.country === "US") entry.us.add(w.symbol);
    wlByUser.set(w.user_id, entry);
  }

  // 4) 사용자별 이메일 배치 조회 + 조립
  // 직렬 auth.admin.getUserById(구독자당 1회)는 수백 명에서 60s 타임아웃 → public.users.email 배치 조회(1000청크)로 교체(STEP 794 §8).
  const emailByUser = new Map<string, string>();
  for (let i = 0; i < userIds.length; i += 1000) {
    const { data } = await sb.from("users").select("id,email").in("id", userIds.slice(i, i + 1000));
    for (const u of (data ?? []) as { id: string; email: string | null }[]) {
      if (u.email) emailByUser.set(u.id, u.email);
    }
  }
  const emails: { from: string; to: string; subject: string; html: string; headers: Record<string, string> }[] = [];
  const now = new Date();

  for (const s of subs) {
    const loc: Locale = s.locale === "en" ? "en" : "ko";
    const briefText = briefFor[loc];
    if (!briefText) continue; // 이 로케일 브리핑이 신선하지 않음 — 지어내지 않고 스킵(사용자별)

    const to = emailByUser.get(s.user_id);
    if (!to) continue;

    const wl = wlByUser.get(s.user_id);
    const mine: (ChangeItemData & { market: "KR" | "US" })[] = [];
    if (wl) {
      mine.push(...krChanges.items.filter((it) => wl.kr.has(it.symbol)).map((it) => ({ ...it, market: "KR" as const })));
      mine.push(...usChanges.items.filter((it) => wl.us.has(it.symbol)).map((it) => ({ ...it, market: "US" as const })));
    }
    const moverLines = movers(mine, loc);

    const html = renderHtml({ loc, briefText, moverLines, unsubToken: s.unsub_token });
    const unsubUrl = `${SITE_BASE}/api/email/unsub?token=${s.unsub_token}`;
    emails.push({
      from: FROM,
      to,
      subject: subjectFor(loc, now),
      html,
      headers: {
        "List-Unsubscribe": `<mailto:brief@onetrillion.app?subject=unsubscribe>, <${unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
  }

  if (emails.length === 0) return NextResponse.json({ ok: true, sent: 0, reason: "no_recipients" });

  // 5) Resend batch 발송(100/call)
  let sent = 0;
  const failures: string[] = [];
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(chunk),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) { failures.push(`batch ${i}: ${res.status}`); continue; }
      sent += chunk.length;
    } catch (e) {
      failures.push(`batch ${i}: ${String(e)}`);
    }
  }
  if (failures.length) Sentry.captureMessage(`[email-brief] ${failures.length}개 배치 실패: ${failures.join(" · ")}`, "error");

  return NextResponse.json({ ok: failures.length === 0, sent, attempted: emails.length, failures });
}
