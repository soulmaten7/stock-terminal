import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { isActiveSymbol } from "@/lib/activeMarkets";
import usSymbols from "@/data/us_symbols.json";
import foreignKo from "@/data/foreign_ko_names.json";
// JP/CN/VN/GB 심볼 번들은 STEP 799로 사이트맵에서 빠졌다(파킹 — docs/PARKED_FIELD_SURFACES.md §7).
// 파일 자체는 삭제하지 않음 — 복원 시 ACTIVE_MARKETS에 국가코드 추가 + 아래 overseas 배열에 해당 심볼 배열 다시 스프레드.

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

// 🔴 STEP 828 §3-4: 사이트맵 유령 심볼 정리 — us_symbols 번들엔 상폐·미거래분이 섞여(번들 6773 > 라이브 perf) 봇이
//   해석 안 되는 유령 URL을 훑으면 무의미한 외부호출을 유발한다. 라이브 us_stock_perf에 있는 심볼만 광고한다.
async function usLiveSet(): Promise<Set<string>> {
  try {
    const sb = createAdminClient();
    const { data } = await sb.from("us_stock_perf").select("symbol").limit(20000);
    return new Set((data ?? []).map((r) => String(r.symbol).toUpperCase()));
  } catch {
    return new Set();
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://earthticker.app";
  const now = new Date();
  // 🔴 STEP 830 §9: hreflang(alternates.languages) — en 전면 패리티인데 색인 경로가 ko뿐이었다.
  //   next-intl as-needed: 기본 ko는 무프리픽스·en은 `/en` 프리픽스. x-default = ko(기본).
  const alt = (path: string) => ({ languages: { ko: `${base}${path}`, en: `${base}/en${path}`, "x-default": `${base}${path}` } });

  // 공개 페이지 (admin·mypage·auth는 robots에서 제외됨)
  const staticRoutes: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1.0, freq: "daily" },
    // 2026-09-05(ORDER_트릴리언모델잔재정리_0905): /explore(렌즈 랭킹 전용) 폐지로 항목 제거.
    { path: "/about", priority: 0.5, freq: "monthly" },
    { path: "/advertise", priority: 0.4, freq: "monthly" },
    { path: "/terms", priority: 0.3, freq: "monthly" },
    { path: "/privacy", priority: 0.3, freq: "monthly" },
  ];
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
    alternates: alt(r.path),
  }));

  // KR 종목 (한국시장 우선 · 6자리) — 스냅샷 테이블
  const kr = await krCodes();
  const krEntries: MetadataRoute.Sitemap = kr.map((s) => ({
    url: `${base}/stock/${s}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.7,
    alternates: alt(`/stock/${s}`),
  }));

  // 해외 종목 — ACTIVE_MARKETS(KR·US)만(STEP 799). foreignKo엔 JP/CN/VN/GB 키도 섞여 있어 isActiveSymbol로 재필터.
  //   🔴 STEP 828 §3-4: 라이브 us_stock_perf에 있는 심볼 + 큐레이션 foreignKo만 광고(유령 URL 제거). DB 실패 시 과잉삭제 방지로 전량 유지.
  const live = await usLiveSet();
  const foreignKeys = new Set(Object.keys(foreignKo as Record<string, string>));
  const overseas = Array.from(
    new Set(
      (usSymbols as Sym[])
        .map((r) => r.sym)
        .filter(Boolean)
        .concat([...foreignKeys]), // META·BABA 등 JSON 누락분도 사이트맵에
    ),
  )
    .filter(isActiveSymbol)
    .filter((s) => live.size === 0 || live.has(s.toUpperCase()) || foreignKeys.has(s));
  const overseasEntries: MetadataRoute.Sitemap = overseas.map((s) => ({
    url: `${base}/stock/${encodeURIComponent(s)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
    alternates: alt(`/stock/${encodeURIComponent(s)}`),
  }));

  return [...staticEntries, ...krEntries, ...overseasEntries];
}
