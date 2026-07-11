<!-- 2026-07-02 -->
# STEP 511 — 유료 "AI보기" MVP (LLM이 렌즈를 정직하게 종합) · 수익화 축 첫 조각

## 🔑 실행 전 (사용자 = 본인이 직접)
`.env.local`에 Anthropic 키 추가 (Cowork/Claude Code는 키를 다루지 않음):
```
ANTHROPIC_API_KEY=sk-ant-...
```
> 키 없이도 빌드는 되지만, AI 종합 클릭 시 "키 설정 후 이용" 안내가 뜸(정상). 라이브 테스트는 키 추가 후.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_511_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
무료 렌즈(모멘텀·F-Score·밸류·기술)를 **LLM이 종목 맥락에서 정직하게 종합**하는 유료 "AI보기". **예측기 아님** — 프롬프트가 미래가격 예측·매수/매도 권유를 금지하고, 렌즈 근거로 "현재 상태"만 서술. 온디맨드(누를 때만) + DB 캐시(12h)로 토큰비용 통제.
- **Cowork이 이미 완료**: `ai_view_cache` 테이블(Supabase), `app/api/ai-view/route.ts`(Anthropic Haiku), 렌즈 페이지 "AI 종합 보기" 버튼. 이 STEP = **빌드 + 테스트 + 커밋**.
- ⚠️ API 라우트 → 클린 재시작.

## 0) 확인
```bash
cd ~/stock-terminal
ls -la app/api/ai-view/route.ts "app/stock/[symbol]/page.tsx"
grep -c ANTHROPIC_API_KEY .env.local   # 1이면 키 있음 / 0이면 키 없음(테스트만 제한)
```

## 1) 빌드 + 클린 재시작
```bash
npm run build
```
```bash
pkill -f "next dev"; rm -rf .next && npm run dev
```

## 2) 테스트 (localhost:3333)
- 키 있을 때:
```bash
sleep 8
curl -s -X POST "http://localhost:3333/api/ai-view" -H "Content-Type: application/json" -d '{"symbol":"NVDA","name":"NVIDIA","lenses":[{"key":"momentum","name":"모멘텀(12-1)","short":"중립","long":"강세","detail":{"12-1모멘텀%":25}}],"fscore":{"supported":true,"score":4,"max":9,"grade":"중립","criteria":[]}}' | python3 -m json.tool
```
- [ ] `content`에 한국어 종합(렌즈 근거 요약 + "판단은 본인 몫"), **미래가격 예측·매수매도 권유 없음**.
- [ ] `/stock/NVDA` 페이지 하단 "🤖 AI 종합 보기" 버튼 → 클릭 → 종합 표시. 두 번째는 캐시(즉시).
- [ ] 키 없으면 "ANTHROPIC_API_KEY 설정 후 이용" 안내(에러 아님).

## 3) 커밋
```bash
git add app/api/ai-view/route.ts "app/stock/[symbol]/page.tsx" && git commit -m "feat(ai-view): 유료 AI 종합 MVP — LLM이 렌즈 정직 종합(예측금지·온디맨드·12h 캐시) (STEP 511)" && git push
```

## ⚠️ 노트 / 다음
- 프롬프트가 "예측·권유 금지 + 근거 인용 + 판단은 본인"을 강제 — 3기법 백테스트에서 확인한 "알파는 희박" 현실과 정합. 정직 포지션 유지.
- 비용: 온디맨드 + 12h DB 캐시 → 같은 종목 반복 조회는 1회만 과금. Haiku(최저가).
- 다음 후보: (1) AI보기에 **실시간 뉴스·공시** 입력 추가(현재는 렌즈만 종합) (2) 무료/유료 게이팅(로그인·구독) (3) 결제 PG(Phase 2) (4) 렌즈 더(퀄리티 등) or KR·글로벌.
- ⚠️ 프로덕션(Vercel)에도 ANTHROPIC_API_KEY 환경변수 등록해야 배포본에서 작동.
