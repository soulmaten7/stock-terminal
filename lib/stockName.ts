// 서버 전용 — 종목 심볼 → 표시명 해석. SEO 메타데이터·JSON-LD·사이트맵용.
// 화면(클라)은 /api/lens로 이름을 받지만, 봇/초기 HTML은 그걸 못 봄.
// 그래서 서버컴포넌트가 렌더 전에 여기서 이름을 뽑아 <title>·<h1>·구조화데이터에 심는다.
//   KR(6자리)  → kr_stock_snapshot 테이블 조회(크론이 KRX명으로 채움)
//   US/JP/CN/VN/GB → 번들 JSON(data/*_symbols.json) 인메모리 조회 (네트워크 0)
// 주의: createAdminClient는 SERVICE_ROLE_KEY를 쓰므로 이 파일은 서버에서만 import할 것.
import { createAdminClient } from "./supabase/admin";
import usSymbols from "@/data/us_symbols.json";
import jpSymbols from "@/data/jp_symbols.json";
import cnSymbols from "@/data/cn_symbols.json";
import vnSymbols from "@/data/vn_symbols.json";
import gbSymbols from "@/data/gb_symbols.json";

type SymRow = { sym: string; name: string };

function toMap(arr: SymRow[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of arr) if (r?.sym && r?.name) m.set(r.sym.toUpperCase(), r.name);
  return m;
}

// 큰 JSON은 최초 1회만 Map으로 (모듈 캐시)
let _us: Map<string, string> | null = null;
let _jp: Map<string, string> | null = null;
let _cn: Map<string, string> | null = null;
let _vn: Map<string, string> | null = null;
let _gb: Map<string, string> | null = null;

// 심볼 → 화면용 티커(접미 제거). 클라 페이지와 동일 규칙.
export function tickerOf(symbol: string): string {
  return symbol.replace(/\.(KS|KQ|T|HK|SS|SZ|VN|L)$/i, "");
}

export type StockNameInfo = { name: string; country: "KR" | "US" | "JP" | "CN" | "VN" | "GB" };

// 심볼 하나의 표시명을 서버에서 해석. 없으면 null(호출부가 티커로 폴백).
export async function resolveStockName(symbol: string): Promise<StockNameInfo | null> {
  const s = symbol.toUpperCase();

  // KR: 6자리(±.KS/.KQ) → 스냅샷 테이블
  if (/^\d{6}(\.(KS|KQ))?$/i.test(symbol)) {
    const code = symbol.replace(/\.(KS|KQ)$/i, "");
    try {
      const sb = createAdminClient();
      const { data } = await sb.from("kr_stock_snapshot").select("name").eq("symbol", code).maybeSingle();
      if (data?.name) return { name: String(data.name).trim(), country: "KR" };
    } catch {
      /* 조회 실패 시 폴백(null) */
    }
    return null;
  }

  if (/\.T$/i.test(symbol)) {
    const n = (_jp ||= toMap(jpSymbols as SymRow[])).get(s);
    return n ? { name: n, country: "JP" } : null;
  }
  if (/\.(HK|SS|SZ)$/i.test(symbol)) {
    const n = (_cn ||= toMap(cnSymbols as SymRow[])).get(s);
    return n ? { name: n, country: "CN" } : null;
  }
  if (/\.VN$/i.test(symbol)) {
    const n = (_vn ||= toMap(vnSymbols as SymRow[])).get(s);
    return n ? { name: n, country: "VN" } : null;
  }
  if (/\.L$/i.test(symbol)) {
    const n = (_gb ||= toMap(gbSymbols as SymRow[])).get(s);
    return n ? { name: n, country: "GB" } : null;
  }
  if (/^[A-Z]{1,5}$/.test(s)) {
    const n = (_us ||= toMap(usSymbols as SymRow[])).get(s);
    return n ? { name: n, country: "US" } : null;
  }
  return null;
}
