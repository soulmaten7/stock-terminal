-- 016: users 테이블 V5 정리 (V3 결제 컬럼 제거 + tier 추가)
-- STEP 118 — Layer 3 인증 (카카오 OAuth).
-- ⚠️ 이 마이그레이션은 Cowork 가 Supabase MCP 로 별도 적용 (Claude Code 직접 적용 X).

-- 1) V3 결제 컬럼 제거
ALTER TABLE public.users
  DROP COLUMN IF EXISTS subscription_status,
  DROP COLUMN IF EXISTS subscription_start_date,
  DROP COLUMN IF EXISTS subscription_end_date,
  DROP COLUMN IF EXISTS billing_key;

-- 2) tier 컬럼 추가 (1=일반·2=인증전문가·3=Tier 광고주). role 컬럼은 보존.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tier SMALLINT NOT NULL DEFAULT 1
    CHECK (tier IN (1, 2, 3));

-- 3) 자기소개 + 가입경로
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS oauth_provider TEXT;

-- 4) auth.users 자동 동기화 트리거 (카카오 로그인 시 users 행 자동 생성)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  kakao_nickname TEXT;
  kakao_avatar TEXT;
BEGIN
  -- raw_user_meta_data 에서 카카오 정보 추출
  kakao_nickname := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'preferred_username',
    '트레이더-' || substring(NEW.id::text, 1, 4)
  );
  kakao_avatar := NEW.raw_user_meta_data->>'avatar_url';

  INSERT INTO public.users (id, email, nickname, avatar_url, role, tier, oauth_provider, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@unjong.local'),
    kakao_nickname,
    kakao_avatar,
    'free',
    1,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 연결 (기존 있으면 교체)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5) RLS — 본인만 자기 user 데이터 수정 가능, 모두 조회 가능 (닉네임 표시용)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users public read" ON public.users;
CREATE POLICY "users public read" ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "users self update" ON public.users;
CREATE POLICY "users self update" ON public.users
  FOR UPDATE USING (auth.uid() = id);
