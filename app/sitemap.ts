import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import usSymbols from "@/data/us_symbols.json";
import jpSymbols from "@/data/jp_symbols.json";
import cnSymbols from "@/data/cn_symbols.json";
import vnSymbols from "@/data/vn_symbols.json";
import gbSymbols from "@/data/gb_symbols.json";
import foreignKo from "@/data/foreign_ko_names.json";

// 사이트맵 = 봇에게 "이 페이지들이 있다"고 알리는 목록.
// 기존엔 정적 5개뿐이라 수천 종목 페이지를 구글이 발견할 길이 없었음 → 전 종목 추가.
// 하루 1회 재생성(종목 목록은 자주 안 변함). KR은 한국시장 우선 → priority 높임.
export const revalidate = 86400;

type Sym = { sym: string };

async function krCodes(): Promise<string[]> {
  try {
    const sb = createAdminClient();
    const { data } = await sb.from("kr_stock_snapshot").select("symbol").limit(6000);
    return (data ?? []).map((r) => String(r.symbol)).filter((s) => /^\d{6}$/.test(s));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://onetrillion.app";
  const now = new Date();

  // 공개 페이지 (admin·mypage·auth는 robots에서 제외됨)
  const staticRoutes: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1.0, freq: "daily" },
    { path: "/coin", priority: 0.6, freq: "weekly" },
    { path: "/about", priority: 0.5, freq: "monthly" },
    { path: "/advertise", priority: 0.4, freq: "monthly" },
    { path: "/business", priority: 0.4, freq: "monthly" },
    { path: "/terms", priority: 0.3, freq: "monthly" },
    { path: "/privacy", priority: 0.3, freq: "monthly" },
  ];
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));

  // KR 종목 (한국시장 우선 · 6자리) — 스냅샷 테이블
  const kr = await krCodes();
  const krEntries: MetadataRoute.Sitemap = kr.map((s) => ({
    url: `${base}/stock/${s}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  // 해외 종목 (US/JP/CN/VN/GB) — 번들 JSON
  const overseas = Array.from(
    new Set(
      [
        ...(usSymbols as Sym[]),
        ...(jpSymbols as Sym[]),
        ...(cnSymbols as Sym[]),
        ...(vnSymbols as Sym[]),
        ...(gbSymbols as Sym[]),
      ]
        .map((r) => r.sym)
        .filter(Boolean)
        .concat(Object.keys(foreignKo as Record<string, string>)), // META·BABA 등 JSON 누락분도 사이트맵에
    ),
  );
  const overseasEntries: MetadataRoute.Sitemap = overseas.map((s) => ({
    url: `${base}/stock/${encodeURIComponent(s)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticEntries, ...krEntries, ...overseasEntries];
}
