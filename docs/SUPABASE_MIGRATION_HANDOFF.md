<!-- 2026-06-24 -->
# Supabase 이사 — 마무리 가이드 (사용자 직접 단계)

## ✅ 끝난 것 (Cowork가 MCP로 완료)
새 **Trillion** 전용 프로젝트(`ccbwxcszdoyjxvckedfp`, 서울)에 OLD("OT-Marketing")의 스키마·데이터를 충실히 이사 완료.
- 테이블 **37개** (광고·파트너·채팅 잔재 **10개 제외** → 더 깨끗)
- 뷰 2(advisor_directory·stock_snapshot_v) · 함수 9 · 트리거 7 + **회원가입 트리거(on_auth_user_created)** · FK 34 · RLS 정책 61
- **RLS 구멍 0개** (OLD엔 banner_clicks·chat_reports 2개 있었음 → 제거됨)
- 데이터: **link_hub 100행**, **products 10행** (OLD와 완전 일치 검증)
- 시드 더미(예시 리딩방 5)·테스트 자가등록(2, rejected)은 **일부러 안 옮김**
- fss_advisors(1,738)·youtube(100) = 크론 재적재 예정(아래 3단계)

## 🔴 남은 것 = 너만 할 수 있는 것 (비밀키·대시보드)
> 이 값들은 내가 만지면 안 돼서(보안) 네가 직접 복사·붙여넣기 해야 해.

### 새 프로젝트 값 (env에 넣을 것)
```
NEXT_PUBLIC_SUPABASE_URL=https://ccbwxcszdoyjxvckedfp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjYnd4Y3N6ZG95anh2Y2tlZGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjY0NDAsImV4cCI6MjA5Nzg0MjQ0MH0.1oyJYkRhGm7QwgVzMR7dyv7zNw73CJzXL7FznimJTvQ
SUPABASE_PROJECT_REF=ccbwxcszdoyjxvckedfp
SUPABASE_SERVICE_ROLE_KEY=★ 대시보드에서 복사 ★
DATABASE_URL=★ 대시보드에서 복사 (DB 비밀번호 포함) ★
```
- **SUPABASE_SERVICE_ROLE_KEY**: NEW 대시보드 → Project Settings → **API Keys** → `service_role` `secret` 키 복사.
- **DATABASE_URL**: NEW 대시보드 → Project Settings → Database → Connection string → **Session pooler** URI 복사 (`[YOUR-PASSWORD]` 자리에 새 프로젝트 DB 비번 입력).

---

### 1단계 — 구글 OAuth를 새 프로젝트에 다시 연결
1. **NEW Supabase 대시보드** → Authentication → **Sign In / Providers** → **Google** 켜기 → OLD에서 쓰던 것과 **같은 Client ID / Client Secret** 붙여넣기.
   (못 찾으면 Google Cloud Console → API & Services → Credentials의 OAuth 클라이언트에서 확인)
2. 같은 대시보드 → Authentication → **URL Configuration**
   - **Site URL**: `https://stock-terminal-delta.vercel.app`
   - **Redirect URLs**에 추가:
     - `https://stock-terminal-delta.vercel.app/**`
     - `http://localhost:3333/**`
3. **Google Cloud Console** → Credentials → 해당 OAuth 클라이언트 → **Authorized redirect URIs**에 추가:
   - `https://ccbwxcszdoyjxvckedfp.supabase.co/auth/v1/callback`

> (도메인 onetrillion.app 붙일 때 Site URL·Redirect를 그 도메인으로 또 갱신 — Phase C)

---

### 2단계 — 환경변수 교체 (.env.local + Vercel)
**(A) 로컬 `.env.local`** — 위 5개 값(URL·ANON·PROJECT_REF·SERVICE_ROLE·DATABASE_URL)을 새 프로젝트 값으로 바꿔 저장.

**(B) Vercel** — 둘 중 편한 방법:
- **쉬움(대시보드)**: vercel.com → 프로젝트 → Settings → Environment Variables → 위 5개를 각각 Edit → 새 값 저장.
- **Claude Code(스크립트)**: `.env.local`을 (A)에서 이미 새 값으로 바꿨다면, Claude Code에 아래 실행 — 바뀐 5개만 지우고 다시 올림(비밀값은 네 `.env.local`→Vercel로만 흐름):
```bash
cd ~/stock-terminal
for k in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_PROJECT_REF SUPABASE_SERVICE_ROLE_KEY DATABASE_URL; do
  vercel env rm "$k" production -y 2>/dev/null
  v=$(grep -E "^$k=" .env.local | head -1 | cut -d= -f2- | sed 's/^"//; s/"$//')
  printf '%s' "$v" | vercel env add "$k" production >/dev/null && echo "  ✓ $k"
done
```

---

### 3단계 — 재배포 + fss 재적재 + 확인
> **youtube(100)·link_hub(100)·products(10)는 이미 NEW에 넣어둠.** fss_advisors(1,738)만 크론으로 채우면 됨.

1. 재배포: Claude Code에서 `cd ~/stock-terminal && vercel --prod`
2. **fss_advisors 채우기** (금감원 최신 데이터 새로 받아옴) — 둘 중 하나:
   - **쉬움**: 그냥 스케줄 대기 — fss 크론은 매일 04:00(KST)에 자동 실행돼 1,738건이 채워짐.
   - **즉시**: Vercel 대시보드 → Settings → Environment Variables에서 `CRON_SECRET` 값 복사 후 Claude Code에서:
     ```bash
     curl -H "Authorization: Bearer <CRON_SECRET값>" https://stock-terminal-delta.vercel.app/api/cron/fss-advisors
     ```
   - (youtube도 다시 받고 싶으면 같은 방식으로 `/api/cron/youtube-refresh` — 단 이미 채워둬서 불필요)
3. 확인: 배포 URL 열어서 **구글 로그인** → 종목/상품/링크/유튜브 정상 → 리딩방(금감원) 목록 채워졌는지.

> **참고**: fss를 지금 당장(배포 전) 미리 넣고 싶으면, pg_dump 데이터 복사도 가능 — Claude Code에서 OLD·NEW 둘 다의 Session pooler URI로:
> `pg_dump "<OLD_풀러URI>" --data-only --table=public.fss_advisors | psql "<NEW_풀러URI>"`
> (URI에 DB 비번 포함 = 네가 직접. 안 해도 위 크론이 더 깔끔.)

---

## 그다음 (Phase C)
- onetrillion.app 도메인 → Vercel(가비아 DNS, 이메일 MX 유지) + 위 OAuth Site URL·Redirect를 onetrillion.app로 갱신.

## OLD 프로젝트 정리
- env 교체·배포·테스트가 **다 끝나고 며칠 안정적이면** OLD("OT-Marketing" `qxkmwlkchyxfzxbonhtj`)는 Trillion 용도로는 더 안 씀. (단 그 프로젝트가 다른 용도면 유지 — 이름이 OT-Marketing이라 원래 다른 프로젝트일 수 있음.)
