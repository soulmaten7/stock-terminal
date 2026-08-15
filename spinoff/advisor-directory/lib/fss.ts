import * as cheerio from "cheerio";
// 상대경로: Next 빌드 + 독립 tsx 스크립트(별칭 @/ 미해석) 양쪽에서 동작.
import { createAdminClient } from "./supabase/admin";

const LIST_URL = "https://fine.fss.or.kr/fine/fncco/invsmCnsut/list.do";
const MENU_NO = "900046";
// STEP 0 확정: GET 방식, 파라미터 = pageIndex (function fnSearch(pageIndex) + name="pageIndex").
const PAGE_PARAM = "pageIndex";
const FETCH_DELAY_MS = Number(process.env.FSS_FETCH_DELAY_MS ?? 400);
// ⚠️ 파인은 비브라우저 UA(봇 UA 포함)를 HTTP 000 으로 차단 → 표준 브라우저 UA 필수.
// 일 1회·페이지당 딜레이의 저빈도 공개데이터 수집.
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export interface FssAdvisor {
  biz_no: string;
  company_name: string;
  info_name: string | null;
  representative: string | null;
  valid_from: string | null; // YYYY-MM-DD
  valid_to: string | null;
  address: string | null;
  phone: string | null;
  homepage: string | null;
  email: string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const clean = (s: string) => s.replace(/\s+/g, " ").trim() || "";

async function fetchPage(page: number): Promise<string> {
  const url = `${LIST_URL}?menuNo=${MENU_NO}&${PAGE_PARAM}=${page}`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  if (!res.ok) throw new Error(`FSS page ${page} HTTP ${res.status}`);
  return res.text();
}

// 헤더행을 읽어 컬럼 인덱스를 동적 매핑 (컬럼 순서·추가 컬럼(신고일자 등)에도 안전)
function parsePage(html: string): { rows: FssAdvisor[]; totalPages: number } {
  const $ = cheerio.load(html);

  // 총 페이지 수: "[ 1/174 페이지 ]" 텍스트 → 없으면 fnSearch(N) 최대값으로 보정.
  let totalPages = 1;
  const m = $("body").text().match(/\[\s*\d+\s*\/\s*(\d+)\s*페이지/);
  if (m) {
    totalPages = Number(m[1]);
  } else {
    let maxN = 1;
    const re = /fnSearch\((\d+)\)/g;
    let mm: RegExpExecArray | null;
    while ((mm = re.exec(html)) !== null) {
      const n = Number(mm[1]);
      if (n > maxN) maxN = n;
    }
    totalPages = maxN;
  }

  // 데이터 테이블: 헤더에 '사업자번호' 포함된 table
  const $table = $("table").filter((_, t) => $(t).text().includes("사업자번호")).first();
  const headers = $table.find("thead th, tr:first-child th").map((_, th) => clean($(th).text())).get();
  const idx = (name: string) => headers.findIndex((h) => h.includes(name));

  const cBiz = idx("사업자"), cName = idx("상호"), cInfo = idx("정보명칭"),
        cValid = idx("유효기간"), cRep = idx("대표자"), cAddr = idx("소재지"),
        cTel = idx("전화"), cHome = idx("홈페이지"),
        cMail = idx("E-Mail") >= 0 ? idx("E-Mail") : idx("Mail");

  const rows: FssAdvisor[] = [];
  $table.find("tbody tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 5) return;
    const cell = (i: number) => (i >= 0 && i < tds.length ? clean($(tds[i]).text()) : "");
    const biz = cell(cBiz).replace(/[^0-9]/g, "");
    if (!biz) return;

    // 유효기간 "2026-05-18 ~ 2031-05-17"
    const dates = cell(cValid).match(/(\d{4}-\d{2}-\d{2})/g) ?? [];

    // 홈페이지: a[href] 우선
    const homeHref = (cHome >= 0 ? $(tds[cHome]).find("a").attr("href")?.trim() : "") || cell(cHome);

    rows.push({
      biz_no: biz,
      company_name: cell(cName),
      info_name: cell(cInfo) || null,
      representative: cell(cRep) || null,
      valid_from: dates[0] ?? null,
      valid_to: dates[1] ?? null,
      address: cell(cAddr) || null,
      phone: cell(cTel) || null,
      homepage: homeHref && homeHref !== "#" ? homeHref : null,
      email: cell(cMail) || null,
    });
  });

  return { rows, totalPages };
}

export async function importFssAdvisors(): Promise<{ total: number; pages: number; revoked: number }> {
  const runStarted = new Date().toISOString();
  const sb = createAdminClient(); // RLS 우회 (쓰기)

  const first = parsePage(await fetchPage(1));
  let all: FssAdvisor[] = [...first.rows];
  for (let p = 2; p <= first.totalPages; p++) {
    await sleep(FETCH_DELAY_MS);
    const { rows } = parsePage(await fetchPage(p));
    all = all.concat(rows);
  }

  // upsert (사업자번호 중복 제거)
  const dedup = new Map<string, FssAdvisor>();
  for (const r of all) dedup.set(r.biz_no, r);
  const payload = [...dedup.values()].map((r) => ({
    ...r,
    status: "active",
    source: "fss_fine",
    fetched_at: runStarted,
    updated_at: runStarted,
    raw: r,
  }));

  // 배치 upsert (500개씩)
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await sb.from("fss_advisors").upsert(payload.slice(i, i + 500), { onConflict: "biz_no" });
    if (error) throw error;
  }

  // 이번 수집에 안 잡힌 기존 active 행 = 영업목록 이탈 → revoked (업데이트된 행 수로 집계)
  const { data: revokedRows } = await sb
    .from("fss_advisors")
    .update({ status: "revoked", updated_at: runStarted })
    .lt("fetched_at", runStarted)
    .eq("status", "active")
    .select("biz_no");

  return { total: payload.length, pages: first.totalPages, revoked: revokedRows?.length ?? 0 };
}
