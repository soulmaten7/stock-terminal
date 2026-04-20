import WidgetDetailStub from '@/components/common/WidgetDetailStub';

const COLS = ['구분', '호가', '잔량', '잔량 비율'];
const ROWS = [
  ...Array.from({ length: 10 }, (_, i) => ({
    구분: '매도',
    호가: `${(78700 - i * 100).toLocaleString('ko-KR')}`,
    잔량: `${Math.floor(Math.random() * 20000 + 1000).toLocaleString('ko-KR')}`,
    '잔량 비율': `${(Math.random() * 100).toFixed(1)}%`,
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    구분: '매수',
    호가: `${(78300 - i * 100).toLocaleString('ko-KR')}`,
    잔량: `${Math.floor(Math.random() * 20000 + 1000).toLocaleString('ko-KR')}`,
    '잔량 비율': `${(Math.random() * 100).toFixed(1)}%`,
  })),
];

export default function OrderBookPage() {
  return (
    <WidgetDetailStub
      title="호가창 (10단)"
      description="실시간 10단 호가 데이터입니다. KIS API WebSocket FHKST01010200 기반."
      columns={COLS}
      rows={ROWS}
    />
  );
}
