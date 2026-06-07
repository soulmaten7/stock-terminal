-- 024_room_view_increment.sql
-- 리딩방/채널 조회수 +1 RPC (security definer — RLS 우회, 조회수 카운터용 표준 패턴)
-- ⚠️ 운종 전용 Supabase(ref qxkmwlkchyxfzxbonhtj)에만 적용.

CREATE OR REPLACE FUNCTION public.increment_room_view(p_room_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.leading_rooms SET view_count = view_count + 1 WHERE id = p_room_id;
$$;

-- 익명/로그인 둘 다 호출 가능(조회수는 누구나 올림). 함수가 정의자 권한으로 UPDATE → RLS 우회.
GRANT EXECUTE ON FUNCTION public.increment_room_view(uuid) TO anon, authenticated;
