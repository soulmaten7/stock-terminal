<!-- 2026-07-08 -->
# STEP 656 — VN 공시 정찰 결과 + 다음 세션 VN 실행계획 문서 (문서만·3중 검수)

> **목표**: VN(베트남) 공시 소스 정찰 결과 기록 + 다음 세션이 VN을 바로 진행할 **자급형 실행계획 파일** 신설. **코드 변경 없음, 문서만.**
>
> **정찰 결론(STEP 656)**: VN도 EDINET급 공식 무료 종합 API 없음. TCBS 공개 API(`apipubaws.tcbs.com.vn`)는 도달되나 `tcanalysis/v1/ticker/...` 경로 폐기(404·실측) → 회사-이벤트 엔드포인트는 네트워크 캡처 필요. 대안=CafeF/Vietstock 서버렌더 스크랩. **빌드는 다음 세션.**
>
> **Cowork이 이미 함** (3중 검수 통과):
> - **신설** `docs/NEXT_SESSION_VN_PLAN.md` — 자급형 VN 실행계획(정찰 결과·빌드 계획[GB 미러 2 STEP]·참조 원본·함정·다음=CN·광고).
> - **갱신** `docs/CHANGELOG.md`·`session-context.md`·`docs/SESSION_BOOT.md`·`docs/NEW_SESSION_HANDOFF.md`·`docs/NEXT_SESSION_START.md` — STEP 656 정찰 반영 + "▶ 다음"을 VN 계획 파일로 연결.
> - **갱신** `docs/STEP_655_COMMAND.md` — 푸터 다음-작업 포인터를 VN 계획으로 통일.
> - **검수1**: VN 계획 68줄·7섹션 · 핸드오프 5종 전부 계획파일 연결 · 날짜 07-08. **검수2**: VN 계획 참조(gb-events·filing_summaries·isVN 등) 정확 · 옛 "다음" 잔여 1개 발견→수정. **검수3**: 옛 문자열 0 · 배너 정합.
>
> **전제**: STEP 655(`e0daf12`) 이후. **커밋+push만** (빌드 불필요).

## 0) 변경 확인
```bash
cd ~/stock-terminal && git status --short | grep -E "NEXT_SESSION_VN_PLAN|CHANGELOG|session-context|SESSION_BOOT|NEW_SESSION_HANDOFF|NEXT_SESSION_START|STEP_655_COMMAND|STEP_656_COMMAND"
```

## 1) 커밋 + push (⚠️ 내 8개 파일만 명시적으로 add — 이전 세션 미추적 파일은 제외)
```bash
cd ~/stock-terminal && git add docs/NEXT_SESSION_VN_PLAN.md docs/CHANGELOG.md session-context.md docs/SESSION_BOOT.md docs/NEW_SESSION_HANDOFF.md docs/NEXT_SESSION_START.md docs/STEP_655_COMMAND.md docs/STEP_656_COMMAND.md && git commit -m "docs(vn): STEP 656 VN 공시 정찰 결과 + 다음 세션 VN 실행계획(NEXT_SESSION_VN_PLAN)·3중 검수" && git push
```
- 커밋이 `index.lock` 에러 나면: `rm -f ~/stock-terminal/.git/index.lock` 후 1) 재실행.

## 2) (선택) 이전 세션 미추적 아카이브 정리 — 원하면
> 이전 세션들이 커밋 안 한 아카이브 명령서(`STEP_479~519·624_COMMAND.md`)가 미추적으로 쌓여 있음. CLAUDE.md상 명령서는 보존 대상이라 커밋하는 게 맞음. `AI_BRIEFING_SPEC.md`(수정)는 변경 내용 불명이라 **제외**. 원하면:
```bash
cd ~/stock-terminal && git add docs/STEP_4*_COMMAND.md docs/STEP_5*_COMMAND.md docs/STEP_624_COMMAND.md docs/AI_LENS_TECHNIQUE_MAP.md docs/EXTERNAL_LINKS_POLICY.md && git commit -m "docs: 이전 세션 미추적 아카이브 명령서·문서 커밋(보존)" && git push
```

## ✅ 완료 시 → 이번 세션 종료. 다음 세션: `docs/NEW_SESSION_HANDOFF.md` → `docs/NEXT_SESSION_VN_PLAN.md` 읽고 VN 공시 착수.
