<!-- 2026-06-20 -->
# STEP 298 — [V7 ⑤-b] Supabase 구글 provider 활성화 (Claude Code · Management API)

> Cowork은 Supabase auth 설정을 못 바꾸지만(DB 전용 MCP), **Claude Code는 `.env.local`의 `SUPABASE_ACCESS_TOKEN`(Management PAT)으로 직접 켤 수 있다.** (카카오도 이 방식으로 설정됨)

## ⚠️ 먼저 — 시크릿을 `.env.local`에 한 줄 추가

구글 클라우드에서 복사한 **Client Secret**을 `.env.local` 맨 아래에 추가:
```
GOOGLE_CLIENT_SECRET=여기에_구글_클라이언트_보안비밀_붙여넣기
```
- `.env.local`은 git에 안 올라감(커밋 금지 규칙). 채팅엔 붙여넣지 말 것.
- (Client ID는 공개값이라 STEP에 이미 박혀 있음 — 시크릿만 추가하면 됨)
- 활성화 끝나면 이 줄은 지워도 됨(앱이 쓰지 않음 — Supabase가 저장).

---

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_298_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표

Supabase Auth에서 **Google provider 활성화** + Client ID/Secret 등록을 Management API로 자동 처리.

---

## ▶️ Claude Code가 실행할 명령

```bash
cd ~/stock-terminal

TOKEN=$(grep -E '^SUPABASE_ACCESS_TOKEN=' .env.local | head -1 | cut -d= -f2- | tr -d '[:space:]"')
REF=$(grep -E '^SUPABASE_PROJECT_REF=' .env.local | head -1 | cut -d= -f2- | tr -d '[:space:]"')
SECRET=$(grep -E '^GOOGLE_CLIENT_SECRET=' .env.local | head -1 | cut -d= -f2- | tr -d '[:space:]"')
CLIENT_ID="556427327563-f936e09ribegujf3i1caj8ff46dlkc7a.apps.googleusercontent.com"

if [ -z "$TOKEN" ] || [ -z "$REF" ] || [ -z "$SECRET" ]; then
  echo "❌ .env.local에 SUPABASE_ACCESS_TOKEN / SUPABASE_PROJECT_REF / GOOGLE_CLIENT_SECRET 중 빠진 값이 있습니다."
  exit 1
fi

RESP=$(curl -s -X PATCH "https://api.supabase.com/v1/projects/$REF/config/auth" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"external_google_enabled\": true, \"external_google_client_id\": \"$CLIENT_ID\", \"external_google_secret\": \"$SECRET\"}")

echo "$RESP" | python3 -c "import sys,json
raw=sys.stdin.read()
try:
    d=json.loads(raw)
    if d.get('external_google_enabled') is True:
        print('✅ 구글 provider 활성화 완료 (client_id 등록됨:', bool(d.get('external_google_client_id')), ')')
    else:
        print('⚠️ 활성화 안 됨 — 응답:', raw[:400])
except Exception:
    print('❌ 응답 파싱 실패 (토큰 만료/권한 문제일 수 있음):', raw[:400])"
```

> 코드 변경 없음(빌드·커밋 불필요). API 호출 한 번이라 `git`도 안 건드림.

---

## ✅ 검증

1. 위 명령 출력에 **`✅ 구글 provider 활성화 완료`** 가 떠야 함.
2. (확인용) Supabase 대시보드 → Authentication → Providers → **Google이 Enabled** 인지 봐도 됨.

성공하면:
- `.env.local`의 `GOOGLE_CLIENT_SECRET` 줄은 **지워도 됨** (앱이 쓰지 않음).

---

## 🔜 다음 (이 STEP 다음에)

1. **구글 콘솔 테스트 사용자** — 이건 Google 쪽이라 Claude Code가 못 함. 직접:
   구글 클라우드 → Google 인증 플랫폼 → **대상** → **테스트 사용자**에 본인 구글 이메일 추가
   (또는 **대상 → 게시**로 프로덕션 전환 — 기본 로그인 스코프는 구글 심사 불필요)
2. **STEP 297**(구글 버튼 코드) 실행 → `/auth/login`에서 실제 로그인 테스트.

---

> **한 줄 요약**: Claude Code가 `.env.local`의 Management 토큰으로 Supabase 구글 provider를 API 한 방에 활성화. 시크릿은 `.env.local`에서만 읽음(채팅·git 노출 없음).
