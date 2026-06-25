<!-- 2026-06-24 -->
# 배포 Phase A — Vercel CLI (link + 환경변수 + 배포 → 테스트 URL)

## ⚠️ 먼저 (사용자가 1회, 대화형)
```bash
cd ~/stock-terminal && vercel login
```
브라우저에서 **Vercel 계정 인증** → 터미널 "Success" 뜨면 완료. **이거 한 다음** 아래를 Claude Code에 실행.

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/DEPLOY_VERCEL.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
`.env.local`의 환경변수를 Vercel로 주입(비밀값은 로컬→Vercel 직접, **`SUPABASE_ACCESS_TOKEN` 제외 + `CRON_SECRET` 추가**) + 프로젝트 링크 + **프로덕션 배포** → `xxx.vercel.app` 테스트 URL 확보. (도메인은 Phase C에서 별도.)

---

## 실행

```bash
cd ~/stock-terminal

# 1) Vercel CLI 확인 (이미 설치·로그인됨 — 업그레이드 불필요, v50도 배포 OK. 전역 설치/업그레이드 금지: 권한에러)
vercel --version

# 2) 프로젝트 링크 (개인 스코프, 새 프로젝트 자동 생성)
vercel link --yes

# 3) .env.local → Vercel 환경변수(production). SUPABASE_ACCESS_TOKEN 제외, 값은 stdin으로만.
echo "== 환경변수 주입 시작 =="
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in \#*|"") continue;; esac        # 주석·빈줄 스킵
  key="${line%%=*}"
  val="${line#*=}"
  [ "$key" = "SUPABASE_ACCESS_TOKEN" ] && { echo "skip $key (관리토큰 제외)"; continue; }
  val="${val%\"}"; val="${val#\"}"               # 양끝 따옴표 제거
  printf '%s' "$val" | vercel env add "$key" production >/dev/null 2>&1 && echo "  ✓ $key" || echo "  ! $key (이미 있거나 실패)"
done < .env.local

# 4) CRON_SECRET (크론 인증용) — 랜덤 생성
printf '%s' "$(openssl rand -hex 16)" | vercel env add CRON_SECRET production >/dev/null 2>&1 && echo "  ✓ CRON_SECRET"

# 5) GitHub 연결 (이후 git push 자동배포 — 실패해도 무방, 대시보드서 가능)
vercel git connect --yes 2>/dev/null && echo "✓ GitHub 연결" || echo "git connect 스킵"

# 6) 프로덕션 배포
echo "== 배포 시작 (~2-3분) =="
vercel --prod
```

> 마지막에 **`https://...vercel.app` 주소**가 출력돼. 그게 테스트 URL.

---

## 확인 (배포 후)
- 출력된 `vercel.app` 주소를 **데스크탑 + 폰** 둘 다 열기.
- 홈·종목·상품·리딩방·피드 = 정상(서버 API키로 동작).
- ⚠️ **구글 로그인은 아직 안 됨** — Phase B(Supabase에 이 주소 등록)에서 풀림. 정상.
- 빌드 실패 시: 에러 로그(특히 `Missing env`·타입에러) 알려줘 → 함께 해결.

## 막히면
- `vercel link`/`git connect`가 대화형으로 멈추면 → 그 화면 알려줘(또는 **대시보드 방식**[vercel.com/new에서 레포 import + `.env.local` 통째 붙여넣기]이 더 쉬움 — 둘 중 편한 거).

---

> **다음**: 배포 URL 나오면 → **Phase B** Supabase 인증 URL 추가(로그인 활성화) → **Phase C** onetrillion.app 도메인 연결(가비아 DNS, 이메일 MX 유지).
