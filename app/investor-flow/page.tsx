import WidgetDetailStub from '@/components/common/WidgetDetailStub';

const COLS = ['날짜', '투자자', '코스피 순매수(억)', '코스닥 순매수(억)', '코스피 거래대금(억)', '코스닥 거래대금(억)'];
const INVESTORS = ['외국인', '기관', '개인', '기타법인'];
const ROWS = Array.from({ length: 20 }, (_, i) => {
  const inv = INVESTORS[i % 4];
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

export default function InvestorFlowPage() {
  return (
    <WidgetDetailStub
      title="투자자별 매매동향"
      description="외국인·기관·개인·기타법인 코스피/코스닥 매매동향입니다. KIS API 기반."
      columns={COLS}
      rows={ROWS}
    />
  );
}
