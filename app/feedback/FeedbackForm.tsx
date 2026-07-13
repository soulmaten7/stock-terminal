"use client";
import { useState } from "react";
import { TLensLogo } from "@/components/AiLensBadge";

const UNDERSTOOD = [
  { key: "clear", label: "명확히 이해됐다" },
  { key: "vague", label: "대충 알겠다" },
  { key: "unclear", label: "잘 모르겠다" },
] as const;
const INTENT = [
  { key: "yes", label: "응, 또 올 듯" },
  { key: "maybe", label: "글쎄" },
  { key: "no", label: "아니" },
] as const;

export default function FeedbackForm() {
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
      if (!res.ok) { setErr(j.error || "전송에 실패했어요"); setState("error"); return; }
      setState("done");
    } catch { setErr("네트워크 오류가 났어요"); setState("error"); }
  };

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-unjong-border bg-unjong-surface p-8 text-center">
        <div className="flex justify-center"><TLensLogo size={28} color="#2DD4BF" /></div>
        <p className="mt-3 text-lg font-bold text-unjong-primary">고맙습니다 🙏</p>
        <p className="mt-1 text-sm leading-relaxed text-unjong-muted">남겨주신 피드백은 트릴리언을 다듬는 데 그대로 쓰여요. 솔직한 한마디가 제일 큰 도움이 됩니다.</p>
      </div>
    );
  }

  const label = "block text-sm font-semibold text-unjong-primary";
  const input = "mt-2 w-full rounded-lg border border-unjong-border bg-unjong-surface px-3 py-2.5 text-sm text-unjong-primary placeholder:text-unjong-muted outline-none focus:border-unjong-accent";
  const seg = (active: boolean) => `rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors ${active ? "border-unjong-accent bg-unjong-accent/10 text-unjong-accent" : "border-unjong-border text-unjong-muted hover:bg-unjong-background"}`;

  return (
    <div className="space-y-6 rounded-2xl border border-unjong-border bg-unjong-surface p-5 sm:p-6">
      <div>
        <label className={label}>1. 첫인상을 한 줄로</label>
        <input className={input} value={firstImpression} onChange={(e) => setFirstImpression(e.target.value)} placeholder="예: 깔끔한데 뭘 하는 곳인지 3초 만에 감이 왔다 / 안 왔다" maxLength={500} />
      </div>

      <div>
        <label className={label}>2. ‘TR-AI 렌즈’가 뭔지 이해됐나요?</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {UNDERSTOOD.map((u) => (
            <button key={u.key} type="button" onClick={() => setUnderstood(u.key)} className={seg(understood === u.key)}>{u.label}</button>
          ))}
        </div>
      </div>

      <div>
        <label className={label}>3. 제일 쓸모있던 것 / 아쉬웠던 것</label>
        <textarea className={`${input} min-h-[80px] resize-y`} value={mostUseful} onChange={(e) => setMostUseful(e.target.value)} placeholder="좋았던 점·별로였던 점 아무거나" maxLength={1500} />
      </div>

      <div>
        <label className={label}>4. 버그·어색한 곳 <span className="text-unjong-accent">(제일 중요!)</span></label>
        <textarea className={`${input} min-h-[80px] resize-y`} value={bugs} onChange={(e) => setBugs(e.target.value)} placeholder="안 되는 것, 이상한 것, 헷갈리는 것 — 사소해도 다 좋아요" maxLength={2000} />
      </div>

      <div>
        <label className={label}>5. 다시 올 것 같나요?</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {INTENT.map((i) => (
            <button key={i.key} type="button" onClick={() => setIntent(i.key)} className={seg(intent === i.key)}>{i.label}</button>
          ))}
        </div>
      </div>

      <div>
        <label className={label}>전체 별점 <span className="font-normal text-unjong-muted">(선택)</span></label>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n === rating ? 0 : n)} aria-label={`${n}점`} className={`text-2xl leading-none transition-colors ${n <= rating ? "text-unjong-accent" : "text-unjong-border hover:text-unjong-muted"}`}>★</button>
          ))}
        </div>
      </div>

      <div>
        <label className={label}>연락처·닉네임 <span className="font-normal text-unjong-muted">(선택 — 후속 질문용)</span></label>
        <input className={input} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="이메일·카톡·닉네임 아무거나" maxLength={120} />
      </div>

      {err && <p className="text-sm text-unjong-danger">❌ {err}</p>}

      <button type="button" onClick={submit} disabled={state === "sending"} className="w-full rounded-lg bg-unjong-accent py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50">
        {state === "sending" ? "보내는 중…" : "피드백 보내기"}
      </button>
    </div>
  );
}
