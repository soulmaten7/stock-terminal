"use client";

import { useState } from "react";
import { avatarBg, avatarChar, logoUrl, leverageInfo } from "@/lib/avatar";

export function StockLogo({ code, name, size = 28 }: { code: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);

  // 1) 레버리지/인버스 ETF → 배수 배지 (토스식)
  const lev = leverageInfo(name);
  if (lev) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
        style={{
          width: size,
          height: size,
          background: lev.inverse ? "#F04452" : "#2563EB",
          fontSize: Math.round(size * 0.36),
        }}
      >
        {lev.label}
      </span>
    );
  }

  // 2) 주요 종목 실로고
  const url = logoUrl(code);
  if (url && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        onError={() => setErr(true)}
        className="shrink-0 rounded-full border border-unjong-border bg-white object-contain"
        style={{ width: size, height: size }}
      />
    );
  }

  // 3) 레터 아바타 폴백
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-unjong-primary"
      style={{ width: size, height: size, background: avatarBg(name), fontSize: Math.round(size * 0.4) }}
    >
      {avatarChar(name)}
    </span>
  );
}
