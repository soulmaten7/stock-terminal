<!-- 2026-07-06 -->
# STEP 617 — JP 진짜 일본어 뉴스 + CN R3 커밋 (STEP 614~616 통합)

> **왜 커밋**: Cowork MCP 최종 검수 완료 — 도요타(아쿠아·GR SPORT·엔화가격=일본 국내 뉴스)·소니·닌텐도(Switch2 결산)·소프트뱅크 4종목 모두 한국어·구체사건·무밸류·무전망·무짜깁기·무-stale. **JPX 일본어명으로 진짜 일본 기사 검색 성공.** CN은 R3(zh·영어폴백) 포함.
> **DB 준비 완료**: `jp_names`(4,014행) 시드·`xlsx` devDep 설치는 Cowork이 이미 실행함(재실행 불필요).
> **전제**: STEP 613(`db7f77d`) 이후. 614·615·616(JP 네이티브+CN R3) 코드가 미커밋으로 함께 감.

## 0) 상태 확인
```bash
cd ~/stock-terminal && git status --short
```
- 예상: `lib/jpName.ts`(신규) `scripts/seed_jp_names.ts`(신규) `supabase/migrations/033_jp_names.sql`(신규) `app/api/news-brief/route.ts`(M) `lib/stockNews.ts`(M) `package.json`·`package-lock.json`(M·xlsx) + `docs/STEP_614~617`.
  (`docs/COUNTRY_TAB_PLAYBOOK.md`는 여전히 별개 미커밋 — 제외.)

## 1) 빌드 최종 확인
```bash
cd ~/stock-terminal && npm run build 2>&1 | grep -E "Compiled|Failed|error TS|Error:" | head -10
```

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add "lib/jpName.ts" "scripts/seed_jp_names.ts" "supabase/migrations/033_jp_names.sql" "app/api/news-brief/route.ts" "lib/stockNews.ts" package.json package-lock.json docs/STEP_614_COMMAND.md docs/STEP_615_COMMAND.md docs/STEP_616_COMMAND.md docs/STEP_617_COMMAND.md && git commit -m "feat(ai-r3): JP 뉴스 진짜 일본어 검색(JPX 일본어명 jp_names 4천종목 시드) + CN R3 뉴스(zh·영어폴백) + 영어 폴백·60일 최근성 (STEP 614~616)" && git push
```

## ✅ 완료 시
- **JP R3 = 제대로**(JPX 공식 일본어명 → 진짜 일본 뉴스). "속도보다 제대로" 첫 완성.
- CN R3 = 뉴스 붙음(현재 영어폴백 → **다음 "제대로" = 东方財富 중국어명**).
- 국가별 AI: US·KR 완전체 / JP·CN = R3(JP는 네이티브 완성).
- 다음: **CN 네이티브(东方財富 중국어명)** → 그다음 베트남 탭 등.
