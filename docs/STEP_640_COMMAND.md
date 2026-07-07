<!-- 2026-07-07 -->
# STEP 640 — 세션 문서 갱신 커밋 (SEO 1차 반영)

> **목적**: STEP 635~639(한국어 SEO 1차) 완료 반영 — 문서 4종 헤더 날짜 오늘(2026-07-07)로 + CHANGELOG/BOOT/HANDOFF에 SEO 블록 추가. (하네스 hook = 4개 문서 날짜 오늘 강제.)
>
> **Cowork이 이미 함**: 아래 6개 문서 갱신.
> - `CLAUDE.md`·`docs/CHANGELOG.md`·`session-context.md`·`docs/NEXT_SESSION_START.md` — 날짜 2026-07-07 + SEO 블록.
> - `docs/SESSION_BOOT.md`·`docs/NEW_SESSION_HANDOFF.md` — 최신 배너 STEP 635~639로 갱신(기존 최신 강등).
>
> **전제**: STEP 639(`aa525a5`) 이후. 이 STEP은 **문서 커밋만**(코드 변경 없음·빌드 불필요).

## 0) 날짜 일치 확인 (hook 통과 사전 점검)
```bash
cd ~/stock-terminal && head -1 CLAUDE.md docs/CHANGELOG.md session-context.md docs/NEXT_SESSION_START.md
```
- ✅ 기대: 4개 모두 `<!-- 2026-07-07 -->`.

## 1) 변경 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "CLAUDE|CHANGELOG|session-context|NEXT_SESSION_START|SESSION_BOOT|NEW_SESSION_HANDOFF"
```

## 2) 커밋 + push
```bash
cd ~/stock-terminal && git add CLAUDE.md docs/CHANGELOG.md session-context.md docs/NEXT_SESSION_START.md docs/SESSION_BOOT.md docs/NEW_SESSION_HANDOFF.md docs/STEP_640_COMMAND.md && git commit -m "docs(seo): STEP 635~639 세션 문서 갱신 — 한국어 SEO 1차(종목 SSR·사이트맵·구조화데이터) 반영·날짜 07-07" && git push
```

## ✅ 완료 시 → 🎉 **한국어 SEO 1차 완결**.
- 다음 후보: (a) **구글 서치콘솔 sitemap 제출**(Cowork이 절차 안내·수동) → (b) 한국어 광고 설정 → (c) 해외종목 한글명(애플·도요타) 매핑으로 한국어 검색 강화(선택).
