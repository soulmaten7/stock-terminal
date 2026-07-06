<!-- 2026-07-06 -->
# STEP 611 — 일본탭 R3(뉴스) 완성 커밋 (STEP 607~610 통합)

> **왜 커밋**: Cowork MCP 최종 검수 완료 — 도요타(번역 폴백으로 한국어)·소니·소프트뱅크(2023 옛 문장 제거) 3종목 모두 한국어·최근성·무밸류·무전망·무짜깁기 통과.
> **전제**: STEP 610 코드까지(미커밋). 이 커밋으로 607~610 함께.

## 0) 상태 확인
```bash
cd ~/stock-terminal && git status --short
```
- JP R3 3파일 + 문서만 정상: `lib/stockNews.ts` `lib/lensCompute.ts` `app/api/news-brief/route.ts` + `docs/STEP_60{7,8,9}_COMMAND.md` `docs/STEP_61{0,1}_COMMAND.md`.
  (딴 게 미커밋으로 뜨면 알려줄 것 — 이 커밋엔 안 넣음.)

## 1) 빌드 최종 확인
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add "lib/stockNews.ts" "lib/lensCompute.ts" "app/api/news-brief/route.ts" docs/STEP_607_COMMAND.md docs/STEP_608_COMMAND.md docs/STEP_609_COMMAND.md docs/STEP_610_COMMAND.md docs/STEP_611_COMMAND.md && git commit -m "feat(ai-jp): 일본 R3 뉴스(야후 일본명·ja 로케일) + 요약 한국어 번역 폴백·오래된 연도 문장 제거·60일 최근성 필터(전 국가 공통) (STEP 607~610)" && git push
```

## ✅ 완료 시
- **일본 = R3(뉴스) 완성** (R1·R2 공시=EDINET은 사용자 결정대로 다음, 무료 API 키 등록 필요).
- 뉴스 후처리(한국어 번역·최근성)는 **KR·US에도 적용** → 전 국가 뉴스 품질 개선.
- 국가별 AI 현황: US=R1·R2·R3 / KR=R1·R2·R3 / JP=R3(+공시 대기) / CN=미착수.
- 세션 정리 문서(CHANGELOG 등) 갱신은 별도 마무리 STEP에서.
