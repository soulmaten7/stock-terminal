import WidgetDetailStub from '@/components/common/WidgetDetailStub';

const COLS = ['시각', '체결가', '체결량', '누적 체결강도', '구분'];
const ROWS = Array.from({ length: 20 }, (_, i) => ({
  시각: `15:${String(29 - Math.floor(i / 2)).padStart(2, '0')}:${String(58 - (i % 2) * 3).padStart(2, '0')}`,
  체결가: `${(78400 + Math.floor(Math.random() * 200 - 100)).toLocaleString('ko-KR')}`,
  체결량: `${Math.floor(Math.random() * 3000 + 100).toLocaleString('ko-KR')}`,
  '누적 체결강도': `${(60 + Math.random() * 10).toFixed(1)}%`,
  구분: Math.random() > 0.45 ? '매수' : '매도',
}));

export default function TicksPage() {
  return (
    <WidgetDetailStub
      title="체결창 + 체결강도"
      description="실시간 체결 내역 및 체결강도입니다. KIS API WebSocket FHKST01010300 기반."
      columns={COLS}
      rows={ROWS}
    />
  );
}
