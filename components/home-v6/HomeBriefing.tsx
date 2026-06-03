"use client";

import { useEffect, useState } from "react";
import { LoadingState, EmptyState } from "@/components/ui/State";

type Overnight = { label: string; val: string; change: string; up: boolean };

export default function HomeBriefing() {
  const [overnight, setOvernight] = useState<Overnight[]>([]);
  const [schedule, setSchedule] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stamp, setStamp] = useState("");

  useEffect(() => {
    setStamp(new Date().toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }));
    let cancelled = false;
    (async () => {
      try {
        const j = await (await fetch("/api/home/briefing")).json();
        if (cancelled) return;
        setOvernight(j.overnight || []);
        setSchedule(j.schedule || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="bg-unjong-surface rounded-2xl border border-unjong-border shadow-soft p-5">
      <header className="flex items-center justify-between mb-1">
        <h2 className="text-base font-bold text-unjong-primary">📰 시장 브리핑</h2>
        {stamp && <span className="text-xs text-unjong-muted">{stamp} 기준</span>}
      </header>
      <p className="text-xs text-unjong-muted mb-4">본 요약은 참고용이며, 투자 판단·책임은 본인에게 있습니다.</p>

      {loading ? (
        <LoadingState />
      ) : overnight.length === 0 && schedule.length === 0 ? (
        <EmptyState title="브리핑 데이터 없음" description="간밤 지수·일정 데이터를 불러오지 못했습니다." />
      ) : (
        <div className="space-y-4">
          {overnight.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-unjong-primary mb-2">간밤 미국 시장</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {overnight.map((o) => (
                  <div key={o.label} className="rounded-lg bg-unjong-background px-3 py-2">
                    <p className="text-xs text-unjong-muted">{o.label}</p>
                    <p className="text-sm font-bold text-unjong-primary tabular-nums">{o.val}</p>
                    <p className={`text-xs font-semibold ${o.up ? "text-[#1AC267]" : "text-[#F04452]"}`}>{o.change}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {schedule.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-unjong-primary mb-2">오늘 주요 일정·공시</p>
              <ul className="space-y-1">
                {schedule.map((s, i) => (
                  <li key={i} className="text-sm text-unjong-primary flex items-start gap-1.5">
                    <span className="text-unjong-accent">·</span>
                    <span className="flex-1">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
