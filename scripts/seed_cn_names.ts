// CN 종목(sym) → 중국어명. R3 중국 뉴스를 진짜 중국어로 검색하기 위함(야후 영어명 대체).
//   HK(.HK)      = HKEX 번체 상장목록(ListOfSecurities_c.xlsx) → 繁體名 (zh-HK 검색)
//   A주(.SS/.SZ) = 텐센트 시세 API(qt.gtimg.cn) 응답의 종목명 → 简体名 (zh-CN 검색)
//     ※ 東方財富(push2his)는 한국/데이터센터 IP에서 차단(exit 52·502)돼 텐센트로 대체. 텐센트 응답은 GBK 인코딩 → TextDecoder('gbk')로 디코딩.
// 실행: set -a; source .env.local; set +a; npx tsx scripts/seed_cn_names.ts   (멱등 upsert)
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import syms from '../data/cn_symbols.json';

type Sym = { sym: string; name: string; market: string };
const ALL = syms as Sym[];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('env 없음 (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)'); process.exit(1); }
const sb = createClient(url, key);

// ---- HK: HKEX 번체 상장목록 (5자리 코드 → 繁體名) ----
async function hkMap(): Promise<Record<string, string>> {
  const res = await fetch(
    'https://www.hkex.com.hk/chi/services/trading/securities/securitieslists/ListOfSecurities_c.xlsx',
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  );
  const buf = Buffer.from(await res.arrayBuffer());
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  // HKEX xlsx는 !ref 이 'A1:R8'로 잘못 박혀 있음 → 실제 셀에서 범위 재계산해야 전 종목이 읽힘
  let maxR = 0, maxC = 0;
  for (const k of Object.keys(ws)) {
    if (k[0] === '!') continue;
    const c = XLSX.utils.decode_cell(k);
    if (c.r > maxR) maxR = c.r;
    if (c.c > maxC) maxC = c.c;
  }
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxR, c: maxC } });
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][];
  const map: Record<string, string> = {};
  for (let i = 3; i < rows.length; i++) {
    const code = String(rows[i][0] || '').trim();   // 股份代號 (5자리)
    const name = String(rows[i][1] || '').trim();    // 股份名稱 (번체)
    if (/^\d{5}$/.test(code) && name) map[code] = name;
  }
  return map;
}

// ---- A주: 텐센트 qt.gtimg.cn 배치 (v_sh600519="1~贵州茅台~..." · GBK) ----
const gbk = new TextDecoder('gbk');
function tcode(sym: string): string {
  const code = sym.replace(/\.(SS|SZ)$/i, '');
  return (/\.SS$/i.test(sym) ? 'sh' : 'sz') + code;
}
async function tencentBatch(chunk: Sym[]): Promise<{ sym: string; name_zh: string; market: string }[]> {
  try {
    const res = await fetch('https://qt.gtimg.cn/q=' + chunk.map((s) => tcode(s.sym)).join(','), {
      headers: { Referer: 'https://gu.qq.com/' }, signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const txt = gbk.decode(Buffer.from(await res.arrayBuffer()));
    const out: { sym: string; name_zh: string; market: string }[] = [];
    for (const m of txt.matchAll(/v_(sh|sz)(\d{6})="([^"]*)"/g)) {
      const name = (m[3].split('~')[1] || '').replace(/\s+/g, '').trim();   // 텐센트는 짧은 이름에 공백 패딩 → 제거
      if (name && /[一-鿿]/.test(name)) {
        out.push({ sym: `${m[2]}.${m[1] === 'sh' ? 'SS' : 'SZ'}`, name_zh: name, market: m[1] === 'sh' ? 'ss' : 'sz' });
      }
    }
    return out;
  } catch { return []; }
}

async function mapLimit<T, R>(arr: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(arr.length);
  let i = 0;
  async function w() { while (i < arr.length) { const c = i++; out[c] = await fn(arr[c]); } }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, () => w()));
  return out;
}

(async () => {
  const rows: { sym: string; name_zh: string; market: string }[] = [];

  // HK
  const hk = ALL.filter((s) => /\.HK$/i.test(s.sym));
  let hkHit = 0;
  try {
    const hm = await hkMap();
    for (const s of hk) {
      const code = s.sym.replace(/\.HK$/i, '').padStart(5, '0');
      const nm = hm[code];
      if (nm) { rows.push({ sym: s.sym.toUpperCase(), name_zh: nm, market: 'hk' }); hkHit++; }
    }
  } catch (e) { console.error('HKEX 실패', (e as Error).message); }
  console.log(`HK: ${hkHit}/${hk.length} 매핑`);

  // A주 (.SS/.SZ) — 텐센트 배치(100/req · 동시 8)
  const a = ALL.filter((s) => /\.(SS|SZ)$/i.test(s.sym));
  const chunks: Sym[][] = [];
  for (let i = 0; i < a.length; i += 100) chunks.push(a.slice(i, i + 100));
  const batched = await mapLimit(chunks, 8, tencentBatch);
  let aHit = 0;
  for (const arr of batched) for (const r of arr) { rows.push(r); aHit++; }
  console.log(`A주: ${aHit}/${a.length} 매핑`);

  // upsert (500 chunk)
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await sb.from('cn_names').upsert(rows.slice(i, i + 500), { onConflict: 'sym' });
    if (error) { console.error('upsert 에러', error.message); process.exit(1); }
  }
  console.log(`총 ${rows.length}행 upsert 완료 (HK ${hkHit} + A주 ${aHit})`);
  process.exit(0);
})();
