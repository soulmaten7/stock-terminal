-- link_hub 클릭 로그
CREATE TABLE IF NOT EXISTS public.link_hub_clicks (
    id          BIGSERIAL PRIMARY KEY,
    link_id     BIGINT NOT NULL REFERENCES public.link_hub(id) ON DELETE CASCADE,
    user_id     UUID,
    clicked_at  TIMESTAMPTZ DEFAULT now(),
    referrer    TEXT,
    user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_link_hub_clicks_link_id    ON public.link_hub_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_link_hub_clicks_clicked_at ON public.link_hub_clicks(clicked_at DESC);

ALTER TABLE public.link_hub_clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert link_hub_clicks"
    ON public.link_hub_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can read link_hub_clicks"
    ON public.link_hub_clicks FOR SELECT
    USING (auth.role() = 'service_role');

-- link_hub 즐겨찾기
CREATE TABLE IF NOT EXISTS public.link_hub_favorites (
    user_id     UUID NOT NULL,
    link_id     BIGINT NOT NULL REFERENCES public.link_hub(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, link_id)
);

CREATE INDEX IF NOT EXISTS idx_link_hub_favorites_user ON public.link_hub_favorites(user_id);

ALTER TABLE public.link_hub_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites"
    ON public.link_hub_favorites
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
