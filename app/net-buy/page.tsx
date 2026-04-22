import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// ─── 탭 1: 종목별 TOP 20 ───────────────────────────────────
const TOP_COLS = ['순위', '종목명', '외국인 순매수(억)', '기관 순매수(억)', '현재가', '등락률'];
const TOP_NAMES = ['SK하이닉스','삼성전자','LG전자','POSCO홀딩스','KB금융','삼성바이오로직스','현대차','기아','LG에너지솔루션','셀트리온',
                   'NAVER','카카오','SK이노베이션','삼성SDI','SK텔레콤','하이브','에코프로비엠','한화오션','두산에너빌리티','LS ELECTRIC'];
const TOP_ROWS = Array.from({ length: 20 }, (_, i) => ({
  순위: i + 1,
  종목명: TOP_NAMES[i],
  '외국인 순매수(억)': `+${Math.floor(Math.random() * 3000 + 100).toLocaleString('ko-KR')}`,
  '기관 순매수(억)': `${Math.random() > 0.5 ? '+' : '-'}${Math.floor(Math.random() * 2000 + 50).toLocaleString('ko-KR')}`,
  현재가: `${(Math.random() * 200000 + 5000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}원`,
  등락률: `${(Math.random() * 6 - 1).toFixed(2)}%`,
}));

// ─── 탭 2: 투자자별 매매동향 시계열 ──────────────────────
const FLOW_COLS = ['날짜', '투자자', '코스피 순매수(억)', '코스닥 순매수(억)', '코스피 거래대금(억)', '코스닥 거래대금(억)'];
const FLOW_INVESTORS = ['외국인', '기관', '개인', '기타법인'];
const FLOW_ROWS = Array.from({ length: 20 }, (_, i) => {
  const inv = FLOW_INVESTORS[i % 4];
  const day = `2026-04-${String(20 - Math.floor(i / 4)).padStart(2, '0')}`;
  const sign = inv === '개인' ? '-' : '+';
  return {
    날짜: day,
    투자자: inv,
    '코스피 순매수(억)': `${sign}${Math.floor(Math.random() * 5000 + 100).toLocaleString('ko-KR')}`,
    '코스닥 순매수(억)': `${Math.random() > 0.5 ? '+' : '-'}${Math.floor(Math.random() * 2000 + 50).toLocaleString('ko-KR')}`,
    '코스피 거래대금(억)': `${Math.floor(Math.random() * 20000 + 5000).toLocaleString('ko-KR')}`,
    '코스닥 거래대금(억)': `${Math.floor(Math.random() * 8000 + 1000).toLocaleString('ko-KR')}`,
  };
});

// ─── 페이지 컴포넌트 ──────────────────────────────────────
export default async function NetBuyPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab: 'top' | 'flow' = tab === 'flow' ? 'flow' : 'top';

  return (
    <div className="w-full px-6 py-6">
      {/* 공통 헤더 */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#999] hover:text-black mb-4">
          <ArrowLeft className="w-4 h-4" />
          홈으로
        </Link>
        <h1 className="text-2xl font-bold text-black mb-1">수급</h1>
        <p className="text-sm text-[#666]">
          외국인·기관 순매수 상위 종목과 시장 전체 투자자별 매매동향을 확인합니다.
        </p>
      </div>

      {/* 탭바 */}
      <div className="flex items-center border-b border-[#E5E7EB] mb-6" role="tablist">
        <Link
          href="/net-buy?tab=top"
          role="tab"
          aria-selected={activeTab === 'top'}
          className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${
            activeTab === 'top'
              ? 'border-[#0ABAB5] text-[#0ABAB5]'
              : 'border-transparent text-[#666] hover:text-black'
          }`}
        >
          종목별 TOP
        </Link>
        <Link
          href="/net-buy?tab=flow"
          role="tab"
          aria-selected={activeTab === 'flow'}
          className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${
            activeTab === 'flow'
              ? 'border-[#0ABAB5] text-[#0ABAB5]'
              : 'border-transparent text-[#666] hover:text-black'
          }`}
        >
          시장 동향
        </Link>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'top' ? (
        <TableCard
          title="실시간 수급 TOP"
          description="외국인·기관 순매수 상위 종목. KIS API FHPTJ04400000 기반."
          columns={TOP_COLS}
          rows={TOP_ROWS}
        />
      ) : (
        <TableCard
          title="투자자별 매매동향"
          description="외국인·기관·개인·기타법인 코스피/코스닥 매매동향. KIS API 기반."
          columns={FLOW_COLS}
          rows={FLOW_ROWS}
        />
      )}
    </div>
  );
}

// ─── 인라인 테이블 카드 컴포넌트 ──────────────────────
interface Row { [key: string]: string | number }

function TableCard({
  title,
  description,
  columns,
  rows,
}: {
  title: string;
  description: string;
  columns: string[];
  rows: Row[];
}) {
  return (
    <div>
      <p className="text-sm text-[#666] mb-3">{description}</p>
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between">
          <span className="text-sm font-bold text-black">{title}</span>
          <span className="text-[10px] font-bold text-[#0ABAB5] bg-[#0ABAB5]/10 px-2 py-0.5 rounded">
            실데이터 연결 예정
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#F0F0F0] bg-[#F8F9FA]">
                {columns.map((col) => (
                  <th key={col} className="px-4 py-2.5 text-left font-bold text-[#666]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-[#F0F0F0] hover:bg-[#F8F9FA]">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2 text-[#333]">
                      {String(row[col] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
