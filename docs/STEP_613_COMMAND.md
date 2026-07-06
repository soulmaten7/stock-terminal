<!-- 2026-07-06 -->
# STEP 613 — JP 공시(R1·R2) 보류 결정 문서화 (문서만)

> **목표**: 사용자 결정 기록 — **일본 공시층(R1·R2)은 만들지 않고 R3(뉴스)까지가 JP 완성.** 이유: 무료+실시간 중대공시 소스 부재(EDINET=정기보고서 지연+XBRL 2~4주 / TDnet=실시간이나 ¥70k/월 유료 → 무료 모델 상충). R3 뉴스가 실시간 이벤트 대체. **코드 변경 없음.**
> **전제**: STEP 612(`4335002`) 이후.

## Cowork이 갱신한 문서
- `docs/AI_BRIEFING_SPEC.md` — R4 보류 노트 옆에 **JP 공시 보류 결정** + 국가별 공시 소스 정리(US=EDGAR·KR=DART·JP=없음→R3·CN=미착수).
- `docs/CHANGELOG.md`·`docs/SESSION_BOOT.md`·`docs/NEW_SESSION_HANDOFF.md`·`docs/NEXT_SESSION_START.md`·`session-context.md` — "다음 후보"에서 'JP EDINET' 제거 → 보류 확정으로 정정(미래 세션 재시도 방지).

## 0) 상태 확인
```bash
cd ~/stock-terminal && git status --short
```
- 문서 6개만 정상. (`docs/COUNTRY_TAB_PLAYBOOK.md`가 여전히 뜨면 별개 미커밋 — 제외.)

## 1) 커밋 + push
```bash
cd ~/stock-terminal && git add docs/AI_BRIEFING_SPEC.md docs/CHANGELOG.md docs/SESSION_BOOT.md docs/NEW_SESSION_HANDOFF.md docs/NEXT_SESSION_START.md session-context.md docs/STEP_613_COMMAND.md && git commit -m "docs: JP 공시(R1·R2) 보류 확정 — 무료 실시간 소스 없음(EDINET 정기·XBRL / TDnet 유료) → R3 뉴스로 대체" && git push
```

## ✅ 완료 시: JP = R3(뉴스)까지가 완성으로 문서상 확정.
- 국가별 AI: **US R1·R2·R3 / KR R1·R2·R3 / JP R3 / CN 미착수.**
- 다음 후보: **CN R3**(빠름) · **SEO**. (JP 공시는 재무제표 필요 시 구조화 API/J-Quants로 추후 별도 검토.)
