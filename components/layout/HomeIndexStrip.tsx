"use client";

import { Fragment, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { pickLocale } from "@/lib/lensCopy";
import { changeColorClass } from "@/lib/lensTones";

type Item = { name: string; value: string; changeText?: string; changePct: number; isUp: boolean; group: string };

export default function HomeIndexStrip() {
  const loc = pickLocale(useLocale()); // 등락색 로케일 분기(STEP 777 §2)
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    let cancelled = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const j = await (await fetch("/api/yahoo/indices")).json();
        if (cancelled) return;
        if (j.items && j.items.length > 0) {
          setItems(j.items); // 데이터 있을 때만 갱신 (빈 응답으로 덮어쓰지 않음)
        } else if (!retry) {
          retry = setTimeout(() => { retry = undefined; load(); }, 5000); // 빈 응답: 기존 유지 + 5초 뒤 재시도
        }
      } catch {
        if (!cancelled && !retry) retry = setTimeout(() => { retry = undefined; load(); }, 5000);
      }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(t); if (retry) clearTimeout(retry); };
  }, []);

  if (items.length === 0) return null;
  const loop = [...items, ...items]; // 끊김 없는 루프용 2배 복제

  return (
    <div className="sticky top-0 z-30 hidden h-9 items-center border-b border-white/10 bg-[#0E1116] sm:flex">
      <div className="relative flex-1 overflow-hidden">
        <div className="ticker-track flex h-full items-center whitespace-nowrap">
          {loop.map((it, i) => {
            const showDiv = i > 0 && loop[i - 1].group !== it.group;
            return (
              <Fragment key={i}>
                {showDiv && <span className="mx-1 h-3 w-px shrink-0 bg-unjong-surface/15" />}
                <span className="inline-flex items-center gap-1.5 px-4 text-xs">
                  <span className="text-white/65">{it.name}</span>
                  <span className="font-semibold tabular-nums text-white">{it.value}</span>
                  <span className={`tabular-nums ${changeColorClass(it.changePct, loc)}`}>
                    {it.changeText ? `${it.changeText} ` : ""}({it.isUp ? "+" : ""}{it.changePct.toFixed(2)}%)
                  </span>
                </span>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
