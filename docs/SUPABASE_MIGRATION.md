<!-- 2026-06-24 -->
# Supabase 마이그레이션 — Trillion 전용 프로젝트 분리 (진행 중)

## 왜
기존 활성 프로젝트가 이름 **"OT-Marketing"**(`qxkmwlkchyxfzxbonhtj`, region ap-southeast-1)인데 Trillion 데이터가 거기 들어있음 + 광고/파트너 잔재 테이블 섞임 + RLS 구멍 2개. → **Trillion 전용 새 프로젝트로 이사**(유저 0명 = 지금이 적기).

## 프로젝트 ref
- **OLD**(현 운영): `qxkmwlkchyxfzxbonhtj` ("OT-Marketing", ap-southeast-1)
- **NEW**(이사 대상): `ccbwxcszdoyjxvckedfp` ("Trillion", **ap-northeast-2 서울**) — ✅ 생성 완료, ACTIVE
- org: `zooeiywddjkrctmaqhse`
- Vercel: **stock-terminal-delta.vercel.app** (배포 완료 — 단 아직 OLD 프로젝트 바라봄, env 교체 전까지)

## 진행 상태
- [x] Vercel 배포(Phase A) — env 27개, OLD 프로젝트 연결 상태
- [x] NEW 프로젝트 생성(서울)
- [x] **스키마 적용 완료** — pg_dump 안 쓰고 **Cowork이 MCP 카탈로그 introspection**으로 완전판 재구성해 NEW에 직접 적용. (pg_dump는 IPv6/풀러 막혀서 포기. `_trillion_schema.sql` 768줄 재구성본은 컬럼 누락 있어 **폐기** — dividends·quant_factors·financials 등 컬럼 빠졌었음)
- [x] **잔재 10개 애초에 생성 안 함**(클린): advertisers·banners·banner_clicks·payments·partners·partner_slots·partner_leads·partner_clicks·chat_messages·chat_reports
- [x] **데이터 복사**: link_hub 100·products 10 (OLD와 행수/URL 일치 검증). 시드 더미·테스트 자가등록은 의도적 스킵.
- [x] **검증**: 테이블37·뷰2·함수9·트리거7·FK34·정책61 / RLS 구멍 0 / 보안린트=OLD와 동일(설계상 항목뿐)

### NEW 적용 마이그레이션 (MCP)
`trillion_01_tables` → `trillion_02_fk_and_indexes` → `trillion_03_rls_policies` → `trillion_04_functions_triggers` → `trillion_05_views`

## 남은 단계 (= 사용자 직접 / 비밀키·대시보드) → **`docs/SUPABASE_MIGRATION_HANDOFF.md` 참조**
5. **🔴 구글 OAuth 재설정**(사용자): NEW 대시보드 Auth→Providers→Google(Client ID/Secret) + URL Config Redirect URLs(`https://stock-terminal-delta.vercel.app/**`,`http://localhost:3333/**`) + Google Cloud Console에 새 콜백 `https://ccbwxcszdoyjxvckedfp.supabase.co/auth/v1/callback` 추가.
6. **환경변수 교체**(사용자): `.env.local` + Vercel의 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY`·`SUPABASE_SERVICE_ROLE_KEY`·`DATABASE_URL`·`SUPABASE_PROJECT_REF` → NEW 값. URL·ANON은 핸드오프 문서에 적어둠, SERVICE_ROLE·DATABASE_URL은 대시보드에서 복사.
7. **재배포 + fss·youtube 재적재 + 테스트**.

## 그다음 (배포 마무리)
- Phase C: onetrillion.app 도메인 → Vercel(가비아 DNS A/CNAME, 이메일 MX 유지) + Supabase Site URL을 onetrillion.app로.

## 세션 상태
- 코드 HEAD `8424e9b`(STEP 392). 문서 STEP 392까지 갱신됨. `_trillion_schema.sql`은 임시 산출물(커밋 X 권장).
