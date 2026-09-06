// channel_reports 로케일 표시 — 2026-09-06 콘텐츠 번역 구현(채팅 지시).
// 원칙(자유번역 대상은 자유서술 필드뿐):
//   - title·reasons[].title/detail·earnings_summary → channel_report_translations 조회(LLM 번역 결과)
//   - stock_name·broker → 번역 아님. KR은 kr_stock_snapshot.name_en 조회(+비상장 증권사 소규모 용어집)로
//     대체, US는 원문이 이미 영문이라 로케일 무관 항상 그대로(한국어 화면에서도 영문 유지 — 고유명사).
//   - verdict → 여기서 처리 안 함(자유번역 절대 금지) — components/reports/ReportRow.tsx의
//     VERDICT_LABEL 고정 사전이 정본, 그 함수를 그대로 쓴다(재구현 금지).
import { createAdminClient } from "./supabase/admin";

export type ReportTranslation = {
  report_id: number;
  title: string | null;
  reasons: { title: string; detail?: string }[] | null;
  earnings_summary: string | null;
  status: string;
};

// 비상장 증권사(자체 kr_stock_snapshot 행이 없음) 영문 표기 — 소규모 수동 용어집.
// 상장 증권사는 kr_stock_snapshot.name_en을 1차로 쓰고, 거기 없는 이름만 이 표를 본다.
// 2026-09-06 실측: 메리츠증권·iM증권 둘 다 지주사(메리츠금융지주·iM금융지주)만 상장돼 있고
// 증권 자회사 자체는 별도 상장코드가 없어 kr_stock_snapshot에 안 잡힘.
export const BROKER_EN_GLOSSARY: Record<string, string> = {
  메리츠증권: "Meritz Securities",
  iM증권: "iM Securities", // 2024년 하이투자증권→iM증권 개명(iM금융지주 계열) — 공식 영문 표기 확인 자료 없어 그룹 개명 규칙(iM Bank 등)에 맞춰 판단
};

export async function fetchChannelReportLocaleData(params: {
  ids: number[];
  krSymbols: (string | null)[];
  krBrokers: string[];
  loc: "ko" | "en";
}): Promise<{
  translations: Map<number, ReportTranslation>;
  stockNameEn: Map<string, string>;
  brokerNameEn: Map<string, string>;
}> {
  const sb = createAdminClient();
  const translations = new Map<number, ReportTranslation>();
  const stockNameEn = new Map<string, string>();
  const brokerNameEn = new Map<string, string>();

  if (params.ids.length) {
    const { data } = await sb
      .from("channel_report_translations")
      .select("report_id, title, reasons, earnings_summary, status")
      .eq("target_lang", params.loc)
      .in("report_id", params.ids);
    for (const row of (data ?? []) as ReportTranslation[]) translations.set(row.report_id, row);
  }

  // 이름 조회는 en 로케일에서만 필요(ko 화면은 KR 종목·증권사를 원래도 한글로 보여준다).
  if (params.loc === "en") {
    const symbols = [...new Set(params.krSymbols.filter((s): s is string => !!s))];
    if (symbols.length) {
      const { data } = await sb.from("kr_stock_snapshot").select("symbol, name_en").in("symbol", symbols);
      for (const row of (data ?? []) as { symbol: string; name_en: string | null }[]) {
        if (row.name_en) stockNameEn.set(row.symbol, row.name_en);
      }
    }
    const brokers = [...new Set(params.krBrokers)];
    const needsLookup = brokers.filter((b) => !BROKER_EN_GLOSSARY[b]);
    if (needsLookup.length) {
      const { data } = await sb.from("kr_stock_snapshot").select("name, name_en").in("name", needsLookup);
      for (const row of (data ?? []) as { name: string; name_en: string | null }[]) {
        if (row.name_en) brokerNameEn.set(row.name, row.name_en);
      }
    }
    for (const [ko, en] of Object.entries(BROKER_EN_GLOSSARY)) brokerNameEn.set(ko, en);
  }

  return { translations, stockNameEn, brokerNameEn };
}

export function localizedStockName(
  loc: "ko" | "en",
  country: string,
  symbol: string | null,
  original: string,
  stockNameEn: Map<string, string>
): string {
  if (loc === "en" && country === "KR" && symbol && stockNameEn.has(symbol)) return stockNameEn.get(symbol)!;
  return original; // US는 원문이 이미 영문 — 로케일 무관 항상 원문(고유명사 유지)
}

export function localizedBroker(
  loc: "ko" | "en",
  country: string,
  original: string,
  brokerNameEn: Map<string, string>
): string {
  if (loc === "en" && country === "KR" && brokerNameEn.has(original)) return brokerNameEn.get(original)!;
  return original;
}
