import WidgetDetailStub from '@/components/common/WidgetDetailStub';

const COLS = ['날짜', '시가', '고가', '저가', '종가', '거래량', '등락률'];
const ROWS = Array.from({ length: 20 }, (_, i) => {
  const base = 78000 + Math.floor(Math.random() * 5000 - 2500);
  return {
    날짜: `2026-04-${String(20 - i).padStart(2, '0')}`,
    시가: `${(base - 200).toLocaleString('ko-KR')}`,
    고가: `${(base + 500).toLocaleString('ko-KR')}`,
    저가: `${(base - 400).toLocaleString('ko-KR')}`,
    종가: `${base.toLocaleString('ko-KR')}`,
    거래량: `${(Math.random() * 15000000 + 5000000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
    등락률: `${(Math.random() * 4 - 2).toFixed(2)}%`,
  };
});

export default function ChartPage() {
  return (
    <WidgetDetailStub
      title="차트"
      description="종목별 OHLCV 데이터입니다. TradingView 위젯 임베드 기반 (종목 선택 가능)."
      columns={COLS}
      rows={ROWS}
    />
  );
}
