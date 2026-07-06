// JPX 東証上場銘柄一覧(data_j.xls) → jp_names 테이블 (코드 4자리 → 일본어 銘柄名).
// R3 일본 뉴스를 "トヨタ自動車"처럼 진짜 일본어 이름으로 검색하기 위한 시드. 야후는 영어명만 줘서 대체.
// 실행: set -a; source .env.local; set +a; npm i -D xlsx; npx tsx scripts/seed_jp_names.ts
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const XLS_URL = 'https://www.jpx.co.jp/markets/statistics-equities/misc/tvdivq0000001vg2-att/data_j.xls';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error('env 없음(NEXT_PUBLIC_SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY)'); process.exit(1); }
  const sb = createClient(url, key);

  console.log('다운로드:', XLS_URL);
  const res = await fetch(XLS_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) { console.error('다운로드 실패', res.status); process.exit(1); }
  const buf = Buffer.from(await res.arrayBuffer());
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

  const out: { code: string; name_ja: string }[] = [];
  for (const r of rows) {
    const code = String(r['コード'] ?? '').trim();
    const name = String(r['銘柄名'] ?? '').trim();
    if (/^\d{4}$/.test(code) && name) out.push({ code, name_ja: name });
  }
  console.log('파싱된 4자리 종목:', out.length);
  if (out.length < 1000) { console.error('행 수가 비정상적으로 적음 — 형식 확인 필요'); process.exit(1); }

  await sb.from('jp_names').delete().neq('code', '');
  for (let i = 0; i < out.length; i += 500) {
    const { error } = await sb.from('jp_names').upsert(out.slice(i, i + 500), { onConflict: 'code' });
    if (error) { console.error('insert 실패', error.message); process.exit(1); }
  }
  console.log('✅ jp_names 시드 완료:', out.length, '행');
  process.exit(0);
}
main();
