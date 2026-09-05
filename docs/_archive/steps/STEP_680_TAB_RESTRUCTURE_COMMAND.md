<!-- 2026-07-10 -->
# STEP 680 — 🧭 탭 4개 재구조 (빌드 검증 + 커밋만 · 코드는 Cowork/Opus가 이미 완료)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** **`components/toolbox/ToolboxClient.tsx` 재작성 + `docs/CHANGELOG.md` 기록은 Cowork(Opus)가 이미 직접 완료. `npx tsc --noEmit` = 0 에러 검증까지 끝남.** 이 STEP은 **빌드 확인 + 눈 검증 + 커밋/푸시**만.
**바뀐 것:** 상단 탭이 14개 → **4개(종목 · 정보 · 증권사 · 검증)**. "정보" 안에 하위탭(뉴스·공시·리포트·기업재무·거시·ETF·공모주 | 차트·거래소·토론커뮤니티·유튜브). 콘텐츠 렌더링은 그대로 재사용(무손실). 유튜브·검증(리딩방)=KR 게이팅.

---

## 1. 빌드 확인
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && (npm run dev &) ; sleep 7 ; echo "http://localhost:3333 확인"
```

## 2. 눈으로 확인 (중요 — 런타임)
- 상단 탭이 **종목 · 정보 · 증권사 · 검증** 4개인지.
- **종목** → 보드+AI렌즈 뜨는지(6개국 국가토글 전환).
- **정보** 클릭 → 하위탭 줄(뉴스·공시·리포트·기업재무·거시·ETF·공모주 | 차트·거래소·토론·커뮤니티·유튜브) 뜨고, 각 하위탭 클릭 시 기존 피드/링크 정상.
- **증권사** → BrokerRanking. **검증** → 리딩방(AdvisorDirectory).
- **국가 US로 전환** → "검증" 탭 사라지고(KR 전용), 유튜브 하위탭도 사라짐. 탭이 종목·정보·증권사 3개.
- 새로고침 시 마지막 탭 유지. 모바일 폭에서 상단 4탭 한 줄에 들어오는지.
- console.log 없음.

> 만약 런타임 이상(빈 화면·깨짐)이 있으면 **고치지 말고 그대로 Cowork에 증상 보고** — 아키텍처는 Cowork(Opus)가 담당.

## 3. 커밋 → 푸시
```bash
git add components/toolbox/ToolboxClient.tsx docs/CHANGELOG.md docs/STEP_680_TAB_RESTRUCTURE_COMMAND.md
git commit -m "refactor(nav): 탭 14개→상단 4탭(종목·정보·증권사·검증) 재구조 — 정보 하위탭·KR 게이팅·콘텐츠 무손실(Opus 직접 리팩토링·tsc 0)"
git push
```
> 4개 문서 헤더는 이미 2026-07-10. CHANGELOG STEP 680 기록도 완료(추가 문서작업 불필요).

## Cowork에게 보고
- 빌드 통과 여부 + §2 눈 검증 결과(특히 US 전환 시 검증/유튜브 사라짐, 모바일 4탭 한 줄).
