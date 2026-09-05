<!-- 2026-07-06 -->
# STEP 605 — R3 "기사 짜깁기 금지" 강화 + KR 뉴스 3회 재검증

> **배경**: STEP 604 KR 생성 후 Cowork MCP 검수 → R2 3종목·R3(삼성·NAVER) 가드레일 통과. 단 **R3 SK하이닉스가 서로 다른 기사를 한 문장으로 엮은 정황**(미래에셋 자본조달 + SK 투자). 밸류 누수는 아니나 "안 속게" 포지셔닝엔 거슬림 → R3 프롬프트에 짜깁기 금지 1줄 추가.
> **목표**: 강화된 프롬프트로 **SK하이닉스 R3를 캐시 비우고 3회 새로 생성**, 매번 짜깁기 없는지 확인. 삼성·NAVER도 재생성해 여전히 깨끗한지.
> **⚠️ 커밋 금지** — 3회 출력 붙여주면 **Cowork가 MCP로 최종 행 재검수 후** 커밋 STEP을 줌.
> **전제**: STEP 604 코드(미커밋) 위에 이어서. (아직 아무것도 커밋 안 됨 = STEP 604+605 함께 커밋 예정)

## Cowork이 바꾼 것 (tsc EXIT=0)
- `app/api/news-brief/route.ts` — R3 시스템 프롬프트에 추가: "서로 다른 기사·회사의 내용을 하나로 잇거나 인과로 엮지 말고, 각 사실은 개별 헤드라인에서 확인되는 그대로만(불확실한 연결은 생략)."

## 0) 빌드
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 1) 🔴 SK하이닉스 R3 — 캐시 비우고 3회 새로 생성 (동일 입력 3회 = 일관성 확인)
```bash
cd ~/stock-terminal && (npm run dev >/tmp/kr_r3_dev.log 2>&1 &) ; sleep 14
set -a; source .env.local; set +a
D=$(date -u +%F)
for i in 1 2 3; do
  node -e "const {createClient}=require('@supabase/supabase-js'); const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); sb.from('news_briefs').delete().eq('symbol','000660.KS').eq('as_of','$D').then(()=>process.exit(0)).catch(()=>process.exit(0));"
  echo "===== SK하이닉스 R3 생성 $i/3 ====="; curl -s "http://localhost:3333/api/news-brief?symbol=000660.KS" | head -c 900; echo; echo
done
```
- [ ] 3회 모두: 실적·상장·계약·투자 등 **개별 사실만**. **미래에셋↔SK 같은 서로 다른 주체를 인과로 엮은 문장 없음**. 목표가·밸류·전망 없음.

## 2) 삼성·NAVER 재생성(강화 프롬프트로도 여전히 깨끗한지)
```bash
cd ~/stock-terminal
set -a; source .env.local; set +a
D=$(date -u +%F)
for S in 005930.KS 035420.KS; do
  node -e "const {createClient}=require('@supabase/supabase-js'); const sb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); sb.from('news_briefs').delete().eq('symbol','$S').eq('as_of','$D').then(()=>process.exit(0)).catch(()=>process.exit(0));"
  echo "===== $S R3 재생성 ====="; curl -s "http://localhost:3333/api/news-brief?symbol=$S" | head -c 900; echo; echo
done
# 확인 후: pkill -f "next dev"
```

## 3) 결과 붙여넣기 → Cowork MCP 재검수 대기
- 위 3회 + 삼성·NAVER 출력을 Cowork에 붙여넣기. **Cowork가 news_briefs 최종 행을 MCP로 재확인**(짜깁기·밸류·전망 없음) 후, 문제 없으면 STEP 604+605 통합 커밋 명령을 줌.
- **여기서 멈춤(커밋 X).**

## ✅ 3회 일관 통과 시: R3 KR 신뢰성 확정 → KR AI(R1·R2·R3) 완성 커밋 단계로.
