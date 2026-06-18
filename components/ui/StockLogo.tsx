"use client";

import { useState } from "react";
import { avatarBg, avatarChar, logoUrl, leverageInfo, etfBrand } from "@/lib/avatar";
import { isKrxCode } from "@/lib/code";

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

  // 1.5) 일반 ETF(국내 6자리만) → 브랜드 배지 (KODEX·TIGER… / 레버리지는 위에서 처리)
  //      6자리 가드 → 미국 영문명(SOL·ACE 등) 오탐 방지
  const etf = isKrxCode(code) ? etfBrand(name) : null;
  if (etf) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
        style={{ width: size, height: size, background: etf.color, fontSize: Math.round(size * 0.34) }}
        title={etf.label}
      >
        {etf.short}
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
