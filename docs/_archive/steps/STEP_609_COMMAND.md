<!-- 2026-07-06 -->
# STEP 609 — R3 재수정 재검증 (강화판): 유저메시지에 한국어 강제 + 오늘날짜 최근성

> **배경**: STEP 608 수정(시스템 프롬프트 한국어 + 60일 날짜필터)이 **안 먹힘** — 도요타 여전히 영어(강한 영어 입력), 소프트뱅크 2023(Google이 옛 기사에 최근 pubDate 부여). 
> **재수정**: news-brief **유저 메시지**에 직접 박음 — "오늘은 {today}. (1) summary·tags 반드시 한국어 (2) 최근 2개월 내만·과거 연도(2023 등) 제외 (3) 사건 없으면 빈 문자열." (유저턴 = 시스템턴보다 형식 강제 강함.)
> **⚠️ 커밋 금지** — 재생성+확인. Cowork MCP 검수 후 커밋(607~609 통합).
> **전제**: STEP 608 코드(미커밋) 위에.

## Cowork이 바꾼 것 (tsc EXIT=0)
- `app/api/news-brief/route.ts` — 유저 메시지에 오늘날짜 + 한국어 강제 + 최근성/과거연도 제외 규칙.

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 1) 🔴 JP 재생성 (캐시 비우고, 도요타 3회 + 소니·소프트뱅크)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/jp_r3c_dev.log 2>&1 &) ; sleep 14
set -a; source .env.local 2>/dev/null; set +a
D=$(date -u +%F)
echo "=== 도요타(7203.T) 3회 — 한국어 필수 ==="
for i in 1 2 3; do
  node -e "const {createClient}=require('@supabase/supabase-js'); const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); sb.from('news_briefs').delete().eq('symbol','7203.T').eq('as_of','$D').then(()=>process.exit(0)).catch(()=>process.exit(0));"
  echo "--- 7203.T $i/3 ---"; curl -s "http://localhost:3333/api/news-brief?symbol=7203.T" | head -c 800; echo; echo
done
echo "=== 소니(6758.T)·소프트뱅크(9984.T) 재생성 ==="
for S in 6758.T 9984.T; do
  node -e "const {createClient}=require('@supabase/supabase-js'); const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); sb.from('news_briefs').delete().eq('symbol','$S').eq('as_of','$D').then(()=>process.exit(0)).catch(()=>process.exit(0));"
  echo "--- $S ---"; curl -s "http://localhost:3333/api/news-brief?symbol=$S" | head -c 800; echo; echo
done
# 확인 후: pkill -f "next dev"
```
- [ ] 도요타 3회 모두 **한국어**(영어 X).
- [ ] 소프트뱅크에 **2023 등 과거 연도 실적 언급 없음**.
- [ ] 목표주가·밸류·전망·짜깁기 없음.

## 2) 결과 붙여넣기 → Cowork MCP 검수
- 출력 붙여주면 Cowork가 news_briefs 최종 행 확인. 통과면 607~609 통합 커밋. **아직 안 되면**(도요타 여전히 영어) = 근본 원인은 야후 영어 상호 → 영어 기사이므로, **일본어 종목명 소스 확보**로 방향 전환 판단.
- **여기서 멈춤(커밋 X).**
