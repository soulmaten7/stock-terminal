"use client";
import { useState } from "react";
import { TLensLogo } from "@/components/AiLensBadge";
import { useTranslations } from "next-intl";

// key = /api/feedback 로 전송되는 값(번역 금지). label = 표시용 ko.json 키.
const UNDERSTOOD = [
  { key: "clear", label: "understood.clear" },
  { key: "vague", label: "understood.vague" },
  { key: "unclear", label: "understood.unclear" },
] as const;
const INTENT = [
  { key: "yes", label: "intent.yes" },
  { key: "maybe", label: "intent.maybe" },
  { key: "no", label: "intent.no" },
] as const;

export default function FeedbackForm() {
  const t = useTranslations('Feedback');
  const [firstImpression, setFirstImpression] = useState("");
  const [understood, setUnderstood] = useState("");
  const [mostUseful, setMostUseful] = useState("");
  const [bugs, setBugs] = useState("");
  const [intent, setIntent] = useState("");
  const [rating, setRating] = useState(0);
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState("");

  const submit = async () => {
    setState("sending"); setErr("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_impression: firstImpression,
          trai_understood: understood || null,
          most_useful: mostUseful,
          bugs,
          return_intent: intent || null,
          rating: rating || null,
          contact,
          path: typeof window !== "undefined" ? window.location.pathname : "",
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(j.error || t("errSend")); setState("error"); return; }
      setState("done");
    } catch { setErr(t("errNetwork")); setState("error"); }
  };

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface p-8 text-center">
        <div className="flex justify-center"><TLensLogo size={28} color="#2DD4BF" /></div>
        <p className="mt-3 text-lg font-bold text-unjong-primary">{t('doneTitle')}</p>
        <p className="mt-1 text-sm leading-relaxed text-unjong-muted">{t('doneDesc')}</p>
      </div>
    );
  }

  const label = "block text-sm font-semibold text-unjong-primary";
  const input = "mt-2 w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2.5 text-sm text-unjong-primary placeholder:text-unjong-muted outline-none focus:border-unjong-accent";
  const seg = (active: boolean) => `rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${active ? "border-unjong-accent bg-unjong-accent/10 text-unjong-accent" : "border-unjong-border text-unjong-muted hover:bg-unjong-background"}`;

  return (
    <div className="space-y-6 rounded-2xl border border-unjong-border bg-unjong-surface p-5 sm:p-6">
      <div>
        <label className={label}>{t('q1')}</label>
        <input className={input} value={firstImpression} onChange={(e) => setFirstImpression(e.target.value)} placeholder={t('q1ph')} maxLength={500} />
      </div>

      <div>
        <label className={label}>{t('q2')}</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {UNDERSTOOD.map((u) => (
            <button key={u.key} type="button" onClick={() => setUnderstood(u.key)} className={seg(understood === u.key)}>{t(u.label)}</button>
          ))}
        </div>
      </div>

      <div>
        <label className={label}>{t('q3')}</label>
        <textarea className={`${input} min-h-[80px] resize-y`} value={mostUseful} onChange={(e) => setMostUseful(e.target.value)} placeholder={t('q3ph')} maxLength={1500} />
      </div>

      <div>
        <label className={label}>{t('q4')}<span className="text-unjong-accent">{t('q4em')}</span></label>
        <textarea className={`${input} min-h-[80px] resize-y`} value={bugs} onChange={(e) => setBugs(e.target.value)} placeholder={t('q4ph')} maxLength={2000} />
      </div>

      <div>
        <label className={label}>{t('q5')}</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {INTENT.map((i) => (
            <button key={i.key} type="button" onClick={() => setIntent(i.key)} className={seg(intent === i.key)}>{t(i.label)}</button>
          ))}
        </div>
      </div>

      <div>
        <label className={label}>{t('rating')}<span className="font-normal text-unjong-muted">{t('ratingOpt')}</span></label>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n === rating ? 0 : n)} aria-label={t('ratingAria', { n })} className={`text-2xl leading-none transition-colors ${n <= rating ? "text-unjong-accent" : "text-unjong-border hover:text-unjong-muted"}`}>★</button>
          ))}
        </div>
      </div>

      <div>
        <label className={label}>{t('contact')}<span className="font-normal text-unjong-muted">{t('contactOpt')}</span></label>
        <input className={input} value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t('contactPh')} maxLength={120} />
      </div>

      {err && <p className="text-sm text-unjong-danger">❌ {err}</p>}

      <button type="button" onClick={submit} disabled={state === "sending"} className="w-full rounded-lg bg-unjong-accent py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50">
        {state === "sending" ? t('sending') : t('submit')}
      </button>
    </div>
  );
}
