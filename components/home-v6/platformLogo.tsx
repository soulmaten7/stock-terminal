"use client";

import { useState } from "react";

export const PLATFORM_LABEL: Record<string, string> = {
  telegram: "텔레그램",
  kakao: "카카오",
  discord: "디스코드",
  youtube: "유튜브",
  instagram: "인스타그램",
  facebook: "페이스북",
  naver_band: "네이버밴드",
  naver_cafe: "네이버카페",
  other: "기타",
};

const PLATFORM_DOMAIN: Record<string, string> = {
  telegram: "telegram.org",
  kakao: "kakaocorp.com",
  discord: "discord.com",
  youtube: "youtube.com",
  instagram: "instagram.com",
  facebook: "facebook.com",
  naver_band: "band.us",
  naver_cafe: "naver.com",
};

const PLATFORM_EMOJI: Record<string, string> = {
  telegram: "✈️",
  kakao: "💬",
  discord: "🎮",
  youtube: "▶️",
  instagram: "📷",
  facebook: "👥",
  naver_band: "🟢",
  naver_cafe: "☕",
  other: "📡",
};

const LOGODEV = process.env.NEXT_PUBLIC_LOGODEV_TOKEN;

export function PlatformLogo({ platform, size = 28 }: { platform: string; size?: number }) {
  const [err, setErr] = useState(false);
  const domain = PLATFORM_DOMAIN[platform];
  const url = domain && LOGODEV ? `https://img.logo.dev/${domain}?token=${LOGODEV}&size=128&retina=true` : null;
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
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-unjong-background"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
    >
      {PLATFORM_EMOJI[platform] ?? PLATFORM_EMOJI.other}
    </span>
  );
}
