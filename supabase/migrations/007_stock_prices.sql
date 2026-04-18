-- stock_prices: 일봉 OHLCV 데이터
CREATE TABLE IF NOT EXISTS stock_prices (
    id          BIGSERIAL PRIMARY KEY,
    stock_id    BIGINT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    trade_date  DATE NOT NULL,
    open        NUMERIC,
    high        NUMERIC,
    low         NUMERIC,
    close       NUMERIC NOT NULL,
    volume      BIGINT,
    change      NUMERIC,
    change_percent NUMERIC,
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (stock_id, trade_date)
);

CREATE INDEX IF NOT EXISTS idx_stock_prices_stock_id ON stock_prices(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_prices_trade_date ON stock_prices(trade_date);
CREATE INDEX IF NOT EXISTS idx_stock_prices_stock_date ON stock_prices(stock_id, trade_date DESC);

ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read stock_prices" ON stock_prices FOR SELECT USING (true);
CREATE POLICY "Service role can manage stock_prices" ON stock_prices
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
