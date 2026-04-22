export type DartType = '주요사항' | '정기공시' | '지분공시' | '감사보고' | '공시';

export const TYPE_COLOR: Record<DartType, string> = {
  '주요사항': 'text-[#FF9500] bg-[#FF9500]/10',
  '정기공시': 'text-[#0ABAB5] bg-[#0ABAB5]/10',
  '지분공시': 'text-[#9B59B6] bg-[#9B59B6]/10',
  '감사보고': 'text-[#0066CC] bg-[#0066CC]/10',
  '공시':     'text-[#999] bg-[#F0F0F0]',
};

export function classifyDartType(reportNm: string): DartType {
  if (/주요사항|유상증자|무상증자|합병|분할|자사주|해산/.test(reportNm)) return '주요사항';
  if (/사업보고서|분기보고서|반기보고서|연결/.test(reportNm)) return '정기공시';
  if (/주요주주|대량보유|주식등/.test(reportNm)) return '지분공시';
  if (/감사보고/.test(reportNm)) return '감사보고';
  return '공시';
}

export function fmtDartDate(rcept_dt: string): string {
  if (rcept_dt.length !== 8) return '';
  return `${rcept_dt.slice(4, 6)}/${rcept_dt.slice(6, 8)}`;
}

export function fmtDartDateFull(rcept_dt: string): string {
  if (rcept_dt.length !== 8) return rcept_dt;
  return `${rcept_dt.slice(0, 4)}-${rcept_dt.slice(4, 6)}-${rcept_dt.slice(6, 8)}`;
}
