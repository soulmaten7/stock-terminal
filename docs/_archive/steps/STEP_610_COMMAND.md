<!-- 2026-07-06 -->
# STEP 610 — R3 소스레벨 후처리(결정론): 한국어 번역 폴백 + 오래된 연도 문장 제거

> **배경**: 프롬프트 강화 2회(608·609) 실패. 근본원인 확정 — ① 야후가 영어 상호("Toyota Motor Corporation") 반환 → 영어 기사 → LLM 영어 출력(앱에 일본어 종목명 소스 없음). ② Google RSS가 옛 기사(2023)에 최근 pubDate 부여 → 날짜필터·프롬프트 모두 무력.
> **해결(프롬프트 아님·결정론 후처리)**: news-brief에서 요약 생성 후 —
> - **한국어 아니면 → 한 번 더 호출해 한국어로 번역**(영어 케이스만, 확실히 한국어).
> - **작년 이전 연도(예: 2023) 든 문장은 삭제**(정규식, 구글 재순환 방어). 남는 게 없으면 null.
> **⚠️ 커밋 금지** — 재생성+확인. Cowork MCP 검수 후 커밋(607~610 통합).
> **전제**: STEP 609 코드(미커밋) 위에.

## Cowork이 바꾼 것 (tsc EXIT=0)
- `app/api/news-brief/route.ts` — 요약 후처리 2개(한국어 번역 폴백 + 오래된 연도 문장 제거).

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 1) 🔴 JP 재생성 (캐시 비우고, 도요타 3회 + 소니·소프트뱅크)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/jp_r3d_dev.log 2>&1 &) ; sleep 14
set -a; source .env.local 2>/dev/null; set +a
D=$(date -u +%F)
echo "=== 도요타(7203.T) 3회 — 이제 한국어 강제(번역 폴백) ==="
for i in 1 2 3; do
  node -e "const {createClient}=require('@supabase/supabase-js'); const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); sb.from('news_briefs').delete().eq('symbol','7203.T').eq('as_of','$D').then(()=>process.exit(0)).catch(()=>process.exit(0));"
  echo "--- 7203.T $i/3 ---"; curl -s "http://localhost:3333/api/news-brief?symbol=7203.T" | head -c 800; echo; echo
done
echo "=== 소니(6758.T)·소프트뱅크(9984.T) 재생성 — 소프트뱅크 2023 삭제돼야 ==="
for S in 6758.T 9984.T; do
  node -e "const {createClient}=require('@supabase/supabase-js'); const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); sb.from('news_briefs').delete().eq('symbol','$S').eq('as_of','$D').then(()=>process.exit(0)).catch(()=>process.exit(0));"
  echo "--- $S ---"; curl -s "http://localhost:3333/api/news-brief?symbol=$S" | head -c 800; echo; echo
done
# 확인 후: pkill -f "next dev"
```
- [ ] 도요타 3회 **전부 한국어**(영어 X).
- [ ] 소프트뱅크 요약에 **2023 등 작년 이전 연도 문장 없음**(SB Neo 등 최근 사실만, 없으면 null).
- [ ] 목표주가·밸류·전망·짜깁기 없음.

## 2) 결과 붙여넣기 → Cowork MCP 최종 검수 → 통과면 607~610 통합 커밋
- **여기서 멈춤(커밋 X).**

## ✅ 통과 시: 일본 R3(뉴스) 완성 + 뉴스 후처리(번역·최근성)는 전 국가 개선.
