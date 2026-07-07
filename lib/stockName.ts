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
import foreignKo from "@/data/foreign_ko_names.json";

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

// US 상장명 잡음 제거: "Apple Inc. - Common Stock" → "Apple Inc." (야후 lens명과 정합·제목 깔끔)
function cleanUsName(n: string): string {
  const c = n
    .replace(/\s*[-–]?\s*Common Stock\s*$/i, "")
    .replace(/\s*[-–]?\s*Common Shares\s*$/i, "")
    .replace(/\s*[-–]?\s*Ordinary Shares\s*$/i, "")
    .replace(/[,\s]+$/, "")
    .trim();
  return c || n;
}

export type StockNameInfo = { name: string; en?: string; country: "KR" | "US" | "JP" | "CN" | "VN" | "GB" };

// 해외종목 한글명 오버라이드(서학개미 검색용) — 티커→한글명. 예: TSLA→테슬라, 7203.T→도요타.
// JSON에 없는 종목(META·BABA 등)도 여기 있으면 한글명 반환.
const FK = foreignKo as Record<string, string>;

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

  const ko = FK[s]; // 해외종목 한글명 오버라이드 (있으면 표시명 = 한글, 원어명은 en으로 보존)

  if (/\.T$/i.test(symbol)) {
    const en = (_jp ||= toMap(jpSymbols as SymRow[])).get(s);
    if (ko) return { name: ko, en: en || undefined, country: "JP" };
    return en ? { name: en, country: "JP" } : null;
  }
  if (/\.(HK|SS|SZ)$/i.test(symbol)) {
    const en = (_cn ||= toMap(cnSymbols as SymRow[])).get(s);
    if (ko) return { name: ko, en: en || undefined, country: "CN" };
    return en ? { name: en, country: "CN" } : null;
  }
  if (/\.VN$/i.test(symbol)) {
    const en = (_vn ||= toMap(vnSymbols as SymRow[])).get(s);
    if (ko) return { name: ko, en: en || undefined, country: "VN" };
    return en ? { name: en, country: "VN" } : null;
  }
  if (/\.L$/i.test(symbol)) {
    const en = (_gb ||= toMap(gbSymbols as SymRow[])).get(s);
    if (ko) return { name: ko, en: en || undefined, country: "GB" };
    return en ? { name: en, country: "GB" } : null;
  }
  if (/^[A-Z]{1,5}$/.test(s)) {
    const raw = (_us ||= toMap(usSymbols as SymRow[])).get(s);
    const en = raw ? cleanUsName(raw) : undefined;
    if (ko) return { name: ko, en, country: "US" }; // META·BABA 등 JSON에 없어도 한글명 반환
    return en ? { name: en, country: "US" } : null;
  }
  return null;
}
