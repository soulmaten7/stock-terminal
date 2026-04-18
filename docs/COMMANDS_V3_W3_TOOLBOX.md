# W3 — 투자자 도구함 (/toolbox) 구현

## 목표
스펙 3.4 "투자자 도구함 (Link Hub)" 기반 외부 서비스 링크 큐레이션 페이지
- URL: /toolbox
- 10 카테고리 × 5+ 링크 (link_hub 테이블 56건 이미 시딩됨)
- 카테고리 아코디언 + 검색 + 즐겨찾기(로그인 유저) + 클릭 로그
- 카테고리 상단 Partner Slot placeholder (W4에서 채움)
- 네이밍 "도구함" 은 임시, 페이지 완성 후 rename 예정

## STEP 0 — 기존 자원 파악
1. link_hub 테이블 스키마 확인:
   echo "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='link_hub' ORDER BY ordinal_position;" | python3 scripts/sql-exec.py
2. 카테고리 분포:
   echo "SELECT category, COUNT(*) FROM public.link_hub GROUP BY 1 ORDER BY 1;" | python3 scripts/sql-exec.py
3. 샘플 3건:
   echo "SELECT * FROM public.link_hub LIMIT 3;" | python3 scripts/sql-exec.py

## STEP 1 — 클릭 로그 테이블
supabase/migrations/008_link_hub_clicks.sql 생성:
- id BIGSERIAL PK, link_id BIGINT REFERENCES link_hub(id), user_id UUID nullable, clicked_at TIMESTAMPTZ default now(), referrer TEXT, user_agent TEXT
- 인덱스: link_id, clicked_at
- RLS: insert anyone, select service_role only

마이그레이션 적용:
  cat supabase/migrations/008_link_hub_clicks.sql | python3 scripts/sql-exec.py

## STEP 2 — 백엔드 API
- app/api/toolbox/list/route.ts — 카테고리별 링크 그룹화 반환. 로그인 유저는 즐겨찾기 조인 (link_hub_favorites 테이블 있으면, 없으면 빈 배열)
- app/api/toolbox/click/route.ts — POST body { linkId } → link_hub_clicks insert, fire-and-forget (200 즉시 반환)
- app/api/toolbox/favorite/route.ts — POST body { linkId, favorite: bool } → 로그인 검증 후 upsert/delete

즐겨찾기 테이블 link_hub_favorites 없으면 008 마이그레이션에 같이 추가:
- user_id UUID, link_id BIGINT, created_at, PRIMARY KEY(user_id, link_id)

## STEP 3 — UI 구축
app/toolbox/page.tsx (Server Component):
- 서버에서 링크 + 즐겨찾기 쿼리 → <ToolboxClient initialData={...} />

components/toolbox/ToolboxClient.tsx (Client):
- 상단 헤더: 제목 "투자자 도구함" + 서브 "외부 서비스 큐레이션 · 10 카테고리"
- 검색 박스 (실시간 client-side filter, 제목/설명/URL 대상)
- 카테고리 전체 펼침/접기 토글 버튼
- 카테고리별 <CategorySection />

components/toolbox/CategorySection.tsx:
- 카테고리 제목 + 개수 뱃지 + 접/펴기
- 상단에 <PartnerSlotPlaceholder slotId={`toolbox-category-${category.slug}`} /> (빈 dashed div, "Partner Slot — W4 구현 예정" 표시)
- 링크 카드 그리드 (2~3열 반응형)

components/toolbox/LinkCard.tsx:
- favicon (https://www.google.com/s2/favicons?domain=URL&sz=32)
- 제목 (굵게) + URL 도메인 (작게, 회색)
- 한줄 설명
- 우측 별표 (로그인 유저만 보임, 즐겨찾기 토글)
- 클릭: onClick 에서 /api/toolbox/click fire + window.open(url, '_blank')

스타일:
- 라이트 테마 (bg-white, border-[#E5E7EB], text-black)
- accent #0ABAB5 (hover, active state)
- 한국 UP=RED/DOWN=BLUE 컨벤션은 이 페이지에 없음 (중립 톤)
- Bento Grid 느낌: 카드마다 subtle shadow + rounded-xl

## STEP 4 — 네비 추가
components/layout/Header.tsx 네비 목록에 "도구함" 항목 추가 (href=/toolbox). 기존 네비 아이템 사이 적절한 위치.

## STEP 5 — 검증
1. npm run build 에러 0
2. curl -s "http://localhost:3333/api/toolbox/list" | jq '{categoryCount: (.categories|length), firstCategoryLinkCount: (.categories[0].links|length)}'
   expected: categoryCount ≥ 10, firstCategoryLinkCount ≥ 5
3. 링크 1개 클릭 후 클릭 로그 증가 확인:
   echo "SELECT count(*) FROM public.link_hub_clicks;" | python3 scripts/sql-exec.py

## STEP 6 — 대기 (Cowork Chrome MCP 검증)

## STEP 7 — git commit
"feat(W3): 투자자 도구함 /toolbox + 클릭 로그 + 즐겨찾기"
push 는 Cowork 검증 후
