<!-- 2026-07-06 -->
# STEP 606 — 한국탭 AI(R1·R2·R3) 완성 커밋 (STEP 604+605 통합)

> **왜 커밋**: Cowork MCP 검수 완료 — R2 3종목(삼성·SK하이닉스·NAVER) DART 공시 반영·무예측·무밸류, R3 3회 일관·짜깁기 없음·무전망. "US 완성형 → KR 데이터 교체" 실증됨.
> **전제**: STEP 605 코드까지 얹힌 상태(미커밋). 이 커밋으로 604+605 함께 올림.

## 0) 상태 확인(혹시 딴 게 섞였나)
```bash
cd ~/stock-terminal && git status --short
```
- KR AI 5파일 + 문서만 수정돼 있어야 정상: `lib/stockNews.ts` `lib/dart.ts` `app/api/news-brief/route.ts` `app/api/brief/route.ts` `app/stock/[symbol]/page.tsx` + `docs/*`.
  (보드 파일 등 딴 게 미커밋으로 남아있으면 알려줄 것 — 이 커밋엔 안 넣음.)

## 1) 빌드 최종 확인
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add "lib/stockNews.ts" "lib/dart.ts" "app/api/news-brief/route.ts" "app/api/brief/route.ts" "app/stock/[symbol]/page.tsx" docs/AI_BRIEFING_SPEC.md docs/STEP_604_COMMAND.md docs/STEP_605_COMMAND.md docs/STEP_606_COMMAND.md && git commit -m "feat(ai-kr): 한국탭 AI 확장 — R2 브리핑에 DART 공시 + R3 뉴스 한글명·한국 로케일 + R3 기사 짜깁기 금지 가드레일 (STEP 604~605) · R4 영구보류 문서화" && git push
```

## ✅ 완료 시: KR = R1(공시요약)·R2(브리핑)·R3(뉴스) 완성. US에 이어 **두 번째 국가 AI 완결**.
- 남은 국가(일본·중국)는 같은 방식(코드 그대로 · 데이터 교체) — 사용자 승인 후 진행.
- 세션 정리 문서(CHANGELOG·session-context·NEXT_SESSION·SESSION_BOOT) 갱신은 별도 마무리 STEP에서.
