"use client";

import { useState } from "react";
import { avatarBg, avatarChar, logoUrl } from "@/lib/avatar";

// 종목 로고: 주요 종목은 실로고, 없거나 로딩 실패 시 레터 아바타.
export function StockLogo({ code, name, size = 28 }: { code: string; name: string; size?: number }) {
  const url = logoUrl(code);
  const [err, setErr] = useState(false);

  if (url && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        onError={() => setErr(true)}
        className="shrink-0 rounded-full object-contain bg-white border border-unjong-border"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-unjong-primary"
      style={{ width: size, height: size, background: avatarBg(name), fontSize: Math.round(size * 0.4) }}
    >
      {avatarChar(name)}
    </span>
  );
}
