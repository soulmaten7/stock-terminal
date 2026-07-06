// dart_corp_codes 시드 — DART corpCode.xml(전체 법인코드 zip)에서 '상장사'(stock_code 6자리)만 추출 → 테이블 채움.
// getDartCorpCode(stock_code) 가 이 테이블을 조회 → KR 공시 이벤트 층(STEP 595)의 전제.
// 실행: set -a; source .env.local; set +a; npx tsx scripts/seed_dart_corp_codes.ts
import { unzipSync, strFromU8 } from 'fflate';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const key = process.env.DART_API_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('DART_API_KEY 없음 (.env.local)');
  if (!url || !svc) throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 없음');
  const sb = createClient(url, svc, { auth: { autoRefreshToken: false, persistSession: false } });

  console.log('1) DART corpCode.xml(zip) 받는 중…');
  const res = await fetch(`https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${key}`);
  if (!res.ok) throw new Error(`DART HTTP ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());

  console.log('2) 압축 해제 + 파싱…');
  const files = unzipSync(buf);
  const xmlName = Object.keys(files).find((n) => n.toLowerCase().endsWith('.xml'));
  if (!xmlName) throw new Error('zip 안에 xml 없음 (키 오류 시 xml 대신 에러 메시지가 옴)');
  const xml = strFromU8(files[xmlName]);

  const clean = (s: string) => s.replace(/<!\[CDATA\[|\]\]>/g, '').trim();
  const rows: { corp_code: string; corp_name: string | null; stock_code: string }[] = [];
  for (const m of xml.matchAll(/<list>([\s\S]*?)<\/list>/g)) {
    const b = m[1];
    const corp_code = clean(b.match(/<corp_code>([\s\S]*?)<\/corp_code>/)?.[1] || '');
    const corp_name = clean(b.match(/<corp_name>([\s\S]*?)<\/corp_name>/)?.[1] || '');
    const stock_code = clean(b.match(/<stock_code>([\s\S]*?)<\/stock_code>/)?.[1] || '');
    if (corp_code && /^\d{6}$/.test(stock_code)) rows.push({ corp_code, corp_name: corp_name || null, stock_code });
  }
  console.log(`   상장사 ${rows.length}개 추출.`);
  if (rows.length < 1000) throw new Error(`상장사 수가 비정상(${rows.length}) — DART 응답이 xml이 아닐 수 있음(키 확인).`);

  console.log('3) 테이블 초기화 + 삽입…');
  await sb.from('dart_corp_codes').delete().neq('corp_code', ''); // 전체 삭제(재실행 idempotent)
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await sb.from('dart_corp_codes').insert(chunk);
    if (error) throw error;
    process.stdout.write(`\r   ${Math.min(i + 500, rows.length)}/${rows.length}`);
  }
  console.log('\n4) 검증…');
  const { data } = await sb.from('dart_corp_codes').select('corp_code, corp_name, stock_code').eq('stock_code', '005930').maybeSingle();
  console.log('   삼성전자(005930):', data);
  const { count } = await sb.from('dart_corp_codes').select('*', { count: 'exact', head: true });
  console.log(`   총 ${count}행. 완료.`);
}
main().catch((e) => { console.error('❌', e); process.exit(1); });
