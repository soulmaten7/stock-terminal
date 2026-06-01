type Props = { symbol: string };

export default function StockInsightsTab({ symbol }: Props) {
  return (
    <div className="text-center py-12 text-sm text-unjong-muted">
      <p>📊 인사이트</p>
      <p className="mt-2 text-xs">차트 분석·재무 비교·동종업종 — 추후 통합 예정</p>
      <p className="mt-1 text-xs">현재 종목: {symbol}</p>
    </div>
  );
}
