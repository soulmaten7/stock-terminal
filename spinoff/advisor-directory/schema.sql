-- spinoff/advisor-directory/schema.sql
-- 리딩방·유사투자자문 검증 디렉토리 — 원본 스키마 백업 (2026-08-15, STEP1035 후속)
--
-- 이 파일은 트릴리언 프로덕션 Supabase(ref ccbwxcszdoyjxvckedfp)에서
-- `pg_catalog`/`information_schema`를 직접 조회해 뽑은 실제 DDL이다(추정·재구성 아님).
-- 원본 테이블은 이 스키마를 저장한 뒤 별도 마이그레이션으로 DROP됐다
-- (복원 좌표 = 이 파일이 커밋된 해시. `supabase/migrations/`의 DROP 마이그레이션이
--  그 다음 커밋에서 이 해시를 인용한다).
--
-- 🔴 2026-08-15(같은 날 후속 리뷰) — `link_previews`(§10) 추가. 최초 13개 테이블+뷰를
--   DROP할 때 이름 패턴(advisor|room|leading|business_claim|member|listing|link)에
--   `link_previews`가 걸리지 않아 놓쳤다(패턴에 "link"가 있는데도 "business_link*"만
--   매칭되고 "link_previews"는 매칭 안 됨 — 정규식이 아니라 이름 자체를 훑는 역방향
--   점검에서 발견, `docs/probe_1036_orphan_tables.md` 참고). 아래 §1~9는 최초 DROP
--   대상, §10은 이번에 추가로 DROP한 것 — 시점은 다르지만 같은 "리딩방 전용" 클러스터다.
--
-- 🔴 데이터는 덤프하지 않았다 — 세 가지 이유:
--   ① `fss_advisors`(금감원 파인 원장 캐시, 삭제 시점 1,847행)에는 대표자명·이메일·전화번호가
--      들어 있다. 이건 원 소유자(금융감독원)가 이미 공개한 정보이긴 하지만, 개인 식별정보를
--      우리 저장소(git)에 평문으로 영구 보존하는 것은 불필요한 위험이다. 이 데이터는
--      `scripts/import-fss-advisors.ts`(이 spinoff의 `scripts/` 참고)로 금감원 '파인' 사이트에서
--      **언제든 재수집 가능**하다 — 즉 "잃어버리면 안 되는 유일한 사본"이 아니다.
--   ② 나머지 12개 테이블(`room_favorites`·`room_likes`·`room_reports`·`room_submissions`·
--      `room_reviews`·`room_review_reports`·`leading_rooms`·`leading_room_votes`·
--      `business_claims`·`business_members`·`business_listing`·`business_links`)은
--      삭제 시점 실측 **전부 0행**이었다 — 보관할 데이터 자체가 없었다.
--      (그중 9개는 앱의 `app/api/account/delete/route.ts`가 스스로 "사용자 소유 데이터"로
--       분류해 회원탈퇴 시 삭제하던 테이블이다: room_reports·room_review_reports·room_favorites·
--       room_likes·room_reviews·room_submissions·leading_room_votes·business_claims·
--       business_members. 나머지 3개 — leading_rooms(카탈로그 성격, user_id 없음)·
--       business_listing·business_links(biz_no로 키, 개인 소유 아님) — 는 그 목록에 없었다.)
--   ③ `link_previews`(삭제 시점 1,005행)는 URL·OG 메타데이터(제목·이미지·설명·사이트명)
--      캐시일 뿐 개인정보·사용자 데이터가 전혀 없다(컬럼: url·og_title·og_image·
--      og_description·site_name·status·fetched_at — user_id류 컬럼 자체가 없음).
--      `lib/og.ts`(이 spinoff의 `lib/` 참고)의 `fetchOg()`로 대상 URL을 다시 크롤하면
--      **언제든 재생성 가능**한 캐시라 원본이 아니다.
--
-- 재구축 방법: 이 파일을 새 Postgres/Supabase 프로젝트에 그대로 실행하면 스키마가 복원된다.
-- 그 다음 `scripts/import-fss-advisors.ts`를 돌리면 `fss_advisors`가 다시 채워진다.
-- `link_previews`는 `/api/link-preview`가 실제 요청이 들어올 때마다 lazy하게 다시 채운다.
-- 나머지 12개 테이블은 애초에 데이터가 없었으므로 빈 채로 시작해도 손실이 없다.

-- ============================================================
-- 1) fss_advisors — 금감원 파인(FINE) 유사투자자문업자 신고 원장 캐시
-- ============================================================
CREATE TABLE public.fss_advisors (
  biz_no        TEXT PRIMARY KEY,
  company_name  TEXT NOT NULL,
  info_name     TEXT,
  representative TEXT,
  valid_from    DATE,
  valid_to      DATE,
  address       TEXT,
  phone         TEXT,
  homepage      TEXT,
  email         TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  source        TEXT NOT NULL DEFAULT 'fss_fine',
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw           JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fss_advisors_company ON public.fss_advisors (company_name);
CREATE INDEX idx_fss_advisors_homepage ON public.fss_advisors (homepage) WHERE (homepage IS NOT NULL);

ALTER TABLE public.fss_advisors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fss_advisors public read" ON public.fss_advisors FOR SELECT USING (true);

-- ============================================================
-- 2) leading_rooms — 리딩방 카탈로그(V6 시절, 2026-06 리브랜드 이후 미사용·0행)
-- ============================================================
CREATE TABLE public.leading_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('telegram', 'kakao', 'discord', 'naver_band', 'naver_cafe', 'youtube', 'other')),
  name TEXT NOT NULL,
  operator TEXT,
  description TEXT,
  external_url TEXT,
  pricing TEXT,
  category TEXT[],
  is_certified BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  discussion_count INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  biz_no TEXT,
  cert_type TEXT CHECK (cert_type IS NULL OR cert_type IN ('similar_advisory', 'advisory', 'securities')),
  cert_verified_at TIMESTAMPTZ,
  fss_biz_no TEXT REFERENCES public.fss_advisors(biz_no) ON DELETE SET NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  dislike_count INTEGER NOT NULL DEFAULT 0,
  follower_count INTEGER NOT NULL DEFAULT 0,
  follower_synced_at TIMESTAMPTZ
);
CREATE INDEX idx_leading_rooms_platform ON public.leading_rooms (platform) WHERE (hidden = false);

ALTER TABLE public.leading_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leading_rooms public read" ON public.leading_rooms FOR SELECT USING (hidden = false);

-- 조회수 +1 RPC(익명 호출 가능, RLS 우회) — STEP1035 후속 조사 결과 코드 어디에서도 호출되지 않는 고아 함수였다.
CREATE OR REPLACE FUNCTION public.increment_room_view(p_room_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.leading_rooms SET view_count = view_count + 1 WHERE id = p_room_id;
$$;
GRANT EXECUTE ON FUNCTION public.increment_room_view(uuid) TO anon, authenticated;

-- ============================================================
-- 3) leading_room_votes — leading_rooms 좋아요/싫어요(0행)
-- ============================================================
CREATE TABLE public.leading_room_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.leading_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);
CREATE INDEX idx_leading_room_votes_room ON public.leading_room_votes (room_id);

ALTER TABLE public.leading_room_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room votes read" ON public.leading_room_votes FOR SELECT USING (true);
CREATE POLICY "room votes insert own" ON public.leading_room_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "room votes update own" ON public.leading_room_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "room votes delete own" ON public.leading_room_votes FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_leading_room_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'like' THEN
      UPDATE public.leading_rooms SET like_count = like_count + 1 WHERE id = NEW.room_id;
    ELSE
      UPDATE public.leading_rooms SET dislike_count = dislike_count + 1 WHERE id = NEW.room_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'like' THEN
      UPDATE public.leading_rooms SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.room_id;
    ELSE
      UPDATE public.leading_rooms SET dislike_count = GREATEST(dislike_count - 1, 0) WHERE id = OLD.room_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.vote_type <> OLD.vote_type THEN
    IF NEW.vote_type = 'like' THEN
      UPDATE public.leading_rooms SET like_count = like_count + 1, dislike_count = GREATEST(dislike_count - 1, 0) WHERE id = NEW.room_id;
    ELSE
      UPDATE public.leading_rooms SET dislike_count = dislike_count + 1, like_count = GREATEST(like_count - 1, 0) WHERE id = NEW.room_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_leading_room_vote_count
  AFTER INSERT OR DELETE OR UPDATE ON public.leading_room_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_leading_room_vote_count();

-- ============================================================
-- 4) room_favorites — 사용자 즐겨찾기(fss_advisors 대상, 0행)
-- ============================================================
CREATE TABLE public.room_favorites (
  user_id UUID NOT NULL,
  biz_no TEXT NOT NULL,
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, biz_no)
);

ALTER TABLE public.room_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_favorites_own" ON public.room_favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5) room_likes / room_reports — advisor_directory 뷰의 좋아요·신고 집계용(0행)
--    target_type 기본값 'fss_advisor' — fss_advisors 또는 room_submissions('sub:'+id) 양쪽을 가리킬 수 있음(폴리모픽, FK 없음).
-- ============================================================
CREATE TABLE public.room_likes (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  target_type TEXT NOT NULL DEFAULT 'fss_advisor',
  target_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (target_id, user_id)
);
ALTER TABLE public.room_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_likes_select" ON public.room_likes FOR SELECT USING (true);
CREATE POLICY "room_likes_insert_own" ON public.room_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "room_likes_delete_own" ON public.room_likes FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.room_reports (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  target_type TEXT NOT NULL DEFAULT 'fss_advisor',
  target_id TEXT,
  target_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  content TEXT,
  reporter_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 🔴 RLS는 켜져 있으나 정책이 하나도 없다(전수조회 시 pg_policies에 room_reports 행 0개) —
--   즉 anon/authenticated는 아무 것도 못 하고, 오직 service_role(API 라우트의 admin 클라이언트)만 접근 가능했다.
ALTER TABLE public.room_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6) room_submissions — 사용자가 직접 등록한(금감원 미신고) 채널(0행)
-- ============================================================
CREATE TABLE public.room_submissions (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  room_name TEXT NOT NULL,
  company_name TEXT,
  biz_no TEXT,
  platform TEXT NOT NULL DEFAULT 'etc',
  homepage TEXT NOT NULL,
  intro TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fss_matched BOOLEAN NOT NULL DEFAULT false,
  fss_biz_no TEXT,
  status TEXT NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.room_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_submissions_public_read" ON public.room_submissions FOR SELECT USING (status = 'public');

-- ============================================================
-- 7) room_reviews / room_review_reports — 별점 후기(2026-06 리브랜드로 UI에서 이미 제거, 0행)
-- ============================================================
CREATE TABLE public.room_reviews (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'fss_advisor',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  status TEXT NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  report_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, target_id)
);
CREATE INDEX room_reviews_target_idx ON public.room_reviews (target_id);
ALTER TABLE public.room_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_reviews_select_public" ON public.room_reviews FOR SELECT USING (status = 'visible' OR auth.uid() = user_id);
CREATE POLICY "room_reviews_insert_own" ON public.room_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "room_reviews_update_own" ON public.room_reviews FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "room_reviews_delete_own" ON public.room_reviews FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.room_review_reports (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  review_id BIGINT NOT NULL REFERENCES public.room_reviews(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (review_id, reporter_user_id)
);
ALTER TABLE public.room_review_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rrr_select_own" ON public.room_review_reports FOR SELECT USING (auth.uid() = reporter_user_id);
CREATE POLICY "rrr_insert_own" ON public.room_review_reports FOR INSERT WITH CHECK (auth.uid() = reporter_user_id);

-- ============================================================
-- 8) business_claims / business_members / business_listing / business_links
--    업체(리딩방 운영자) 본인 인증·클레임·채널 관리(전부 0행)
-- ============================================================
CREATE TABLE public.business_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  biz_no TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method TEXT NOT NULL DEFAULT 'doc' CHECK (method IN ('doc', 'phone')),
  doc_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  contact TEXT,
  nts_valid TEXT,
  start_dt TEXT
);
CREATE INDEX business_claims_user_idx ON public.business_claims (user_id);
ALTER TABLE public.business_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_claims read own" ON public.business_claims FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  biz_no TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email TEXT,
  UNIQUE (biz_no, user_id)
);
CREATE INDEX business_members_biz_idx ON public.business_members (biz_no);
CREATE INDEX business_members_user_idx ON public.business_members (user_id);
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_members read own" ON public.business_members FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE public.business_listing (
  biz_no TEXT PRIMARY KEY,
  intro TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.business_listing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_listing public read" ON public.business_listing FOR SELECT USING (true);

CREATE TABLE public.business_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  biz_no TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'room' CHECK (type IN ('room', 'youtube', 'site')),
  platform TEXT,
  url TEXT NOT NULL,
  label TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'expired')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX business_links_biz_idx ON public.business_links (biz_no);
ALTER TABLE public.business_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_links public read active" ON public.business_links FOR SELECT USING (status = 'active');

-- ============================================================
-- 9) advisor_directory — SECURITY DEFINER 뷰(fss_advisors + room_likes/room_reports/room_favorites/room_submissions 조인)
--    🔴 이 CREATE VIEW 문 자체는 git에 커밋된 적이 없었다(Supabase MCP로 직접 적용됐던 것으로 추정).
--    2026-08-15 `pg_get_viewdef()`로 라이브 조회해 뽑은 것이 이 문서가 유일한 원문 기록이다.
--    supabase/migrations/20260712_harden_definer_views_grants.sql이 이 뷰의 grant(anon/authenticated=SELECT만)를
--    별도로 하드닝했었다 — 그 마이그레이션 파일은 다른 뷰도 같이 다루므로 삭제하지 않고 그대로 둔다(이력).
-- ============================================================
CREATE OR REPLACE VIEW public.advisor_directory AS
SELECT a.biz_no,
    a.company_name,
    a.representative,
    a.valid_from,
    a.valid_to,
    a.homepage,
    a.phone,
    a.address,
    COALESCE(l.cnt, 0::bigint)::integer AS like_count,
    COALESCE(r.cnt, 0::bigint)::integer AS report_count,
    CASE
        WHEN a.homepage ~* '://t\.me/'::text THEN 'telegram'::text
        WHEN a.homepage ~* 'open\.kakao|//kakao|\.kakao\.com'::text THEN 'kakao'::text
        WHEN a.homepage ~* 'cafe\.naver\.com|//naver\.me/|band\.us'::text THEN 'naver'::text
        ELSE 'etc'::text
    END AS platform,
    a.info_name,
    'fss'::text AS source,
    NULL::text AS intro,
    COALESCE(f.cnt, 0::bigint)::integer AS favorite_count
   FROM fss_advisors a
     LEFT JOIN ( SELECT room_likes.target_id, count(*) AS cnt FROM room_likes GROUP BY room_likes.target_id) l ON l.target_id = a.biz_no
     LEFT JOIN ( SELECT room_reports.target_id, count(*) AS cnt FROM room_reports WHERE room_reports.status = 'confirmed'::text GROUP BY room_reports.target_id) r ON r.target_id = a.biz_no
     LEFT JOIN ( SELECT room_favorites.biz_no, count(*) AS cnt FROM room_favorites GROUP BY room_favorites.biz_no) f ON f.biz_no = a.biz_no
  WHERE (a.valid_to IS NULL OR a.valid_to >= CURRENT_DATE) AND a.homepage IS NOT NULL AND btrim(a.homepage) <> ''::text
UNION ALL
 SELECT 'sub:'::text || s.id AS biz_no,
    s.company_name,
    NULL::text AS representative,
    NULL::date AS valid_from,
    NULL::date AS valid_to,
    s.homepage,
    NULL::text AS phone,
    NULL::text AS address,
    COALESCE(l2.cnt, 0::bigint)::integer AS like_count,
    COALESCE(r2.cnt, 0::bigint)::integer AS report_count,
    s.platform,
    s.room_name AS info_name,
    'user'::text AS source,
    s.intro,
    COALESCE(f2.cnt, 0::bigint)::integer AS favorite_count
   FROM room_submissions s
     LEFT JOIN ( SELECT room_likes.target_id, count(*) AS cnt FROM room_likes GROUP BY room_likes.target_id) l2 ON l2.target_id = ('sub:'::text || s.id)
     LEFT JOIN ( SELECT room_reports.target_id, count(*) AS cnt FROM room_reports WHERE room_reports.status = 'confirmed'::text GROUP BY room_reports.target_id) r2 ON r2.target_id = ('sub:'::text || s.id)
     LEFT JOIN ( SELECT room_favorites.biz_no, count(*) AS cnt FROM room_favorites GROUP BY room_favorites.biz_no) f2 ON f2.biz_no = ('sub:'::text || s.id)
  WHERE s.status = 'public'::text AND s.homepage IS NOT NULL AND btrim(s.homepage) <> ''::text;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.advisor_directory FROM anon, authenticated;

-- ============================================================
-- 10) link_previews — OG 링크 프리뷰 캐시(advisor 채널 링크 전용, 삭제 시점 1,005행)
--     🔴 §1~9와 별도 라운드(같은 날 후속 리뷰)에 DROP됐다 — 위 헤더 참고.
--     RLS는 켜져 있으나 정책 0개(service_role 전용, room_reports와 같은 패턴).
--     FK 없음(다른 테이블이 이 테이블을 참조하지 않고, 이 테이블도 다른 테이블을 참조 안 함).
-- ============================================================
CREATE TABLE public.link_previews (
  url             TEXT PRIMARY KEY,
  og_title        TEXT,
  og_image        TEXT,
  og_description  TEXT,
  site_name       TEXT,
  status          TEXT NOT NULL DEFAULT 'ok',
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.link_previews ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 알려진 잔여 연결(다른 기능 쪽에서 참조하던 것 — 참고용, 이 스키마 자체엔 포함 안 됨)
-- ============================================================
-- app/api/account/delete/route.ts의 USER_OWNED_TABLES 배열이 위 테이블 중 9개
-- (room_reports·room_review_reports·room_favorites·room_likes·room_reviews·room_submissions·
--  leading_room_votes·business_claims·business_members)를 회원탈퇴 시 정리 대상으로 참조하고 있었다.
-- 이 테이블들을 DROP하기 전에 그 코드에서 해당 9개 항목을 먼저 제거해야
-- 회원탈퇴 기능이 "테이블 없음" 에러로 전체가 죽는 것을 막을 수 있다(STEP1035 후속 별도 커밋 참고).
--
-- public.update_target_discussion_count() 함수(017/019 마이그레이션, platform_discussions 트리거)가
-- target_type='room'일 때 leading_rooms를 UPDATE하는 분기를 갖고 있었다. platform_discussions는
-- 이 스키마와 별개의(여전히 존재하는) 상품·리딩방 통합 리뷰 기능이며 이미 0행·코드 미사용 상태라
-- 이 분기는 도달 불가능한 코드다 — leading_rooms 삭제로 실행 시 에러가 나겠지만 실행될 길이 없다.
-- platform_discussions 자체는 room 전용이 아니라서(target_type IN ('product','room')) 이번 정리 범위 밖으로 남겨뒀다.
