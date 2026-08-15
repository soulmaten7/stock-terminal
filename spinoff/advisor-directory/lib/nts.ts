// 국세청 사업자등록정보 진위확인 (data.go.kr odcloud). serviceKey = DATA_GO_KR_KEY(.env.local, 일반 인증키).
// match=일치 / mismatch=불일치 / unverified=확인불가(키없음·API오류 — 차단하지 않음, 관리자 검토)
export type NtsResult = 'match' | 'mismatch' | 'unverified';

export async function verifyBusiness(b_no: string, start_dt: string, p_nm: string): Promise<NtsResult> {
  const key = process.env.DATA_GO_KR_KEY;
  if (!key || !/^\d{10}$/.test(b_no) || !/^\d{8}$/.test(start_dt) || !p_nm) return 'unverified';
  try {
    const url = `https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=${key}&returnType=JSON`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businesses: [{ b_no, start_dt, p_nm }] }),
      cache: 'no-store',
    });
    if (!res.ok) return 'unverified';
    const j = await res.json();
    const valid = j?.data?.[0]?.valid;
    if (valid === '01') return 'match';
    if (valid === '02') return 'mismatch';
    return 'unverified';
  } catch {
    return 'unverified';
  }
}
