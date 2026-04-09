CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('keyword', 'price')),
  condition text NOT NULL,
  target text,
  is_active boolean DEFAULT true,
  last_triggered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid REFERENCES alerts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_owner" ON alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "alert_history_owner" ON alert_history FOR ALL USING (auth.uid() = user_id);
