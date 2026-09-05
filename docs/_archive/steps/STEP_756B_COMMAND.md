# STEP 756b — 렌즈 도트 폴리시: 도트-only + 범례 위치 확정 (PC 잘림 해소·모바일 2줄 복귀)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet — 2컴포넌트+i18n)

**전제 상태**: 코드 HEAD `8aeac78`(STEP 756) · 트리 클린

**배경(사용자 라이브 확인 · 07-18)**: ① PC 렌즈 컬럼의 "강점 3 · 주의 3 · 보통 1" 텍스트가 현재가 컬럼을 파고들어 잘림(실버그) ② 범례(색 의미)는 행이 아니라 "학습 지점"에 한 번만 — PC=우측 미리보기 카드·모바일=상단 안내 줄. ③ 행이 도트만 남으면 모바일 도트를 종목명 옆에 붙여 **행 2줄 복귀**(밀도 회수).

---

## 수정 1 — `components/toolbox/MarketBoard.tsx`

**(a) 데스크톱 렌즈 컬럼 = 도트만**: 카운트 텍스트("강점 N · 주의 N · 보통 N") 제거, 도트(민트·앰버·회색)만 렌더. 컬럼 폭을 도트 7개 기준으로 축소(잘림·겹침 해소 — 최대 7렌즈 = 도트 7개 + 여유). null은 `—` 유지.

**(b) 모바일 행 = 2줄 복귀**: STEP 756에서 넣은 도트 줄(3줄째) 제거 → **도트를 종목명 오른쪽에 인라인**(`ml-1` 정도·12px). 카운트 텍스트 없음. `lens === null`이면 도트 없이 이름만(— 표시도 없음·깔끔).

**(c) 모바일 안내 줄에 범례 추가**: 기존 힌트 아래 둘째 줄:
```
● 강점  ● 주의  ● 보통  · 사고팔 신호 아님
```
(도트 3색 = 행 도트와 동일 토큰. "사고팔 신호 아님"은 기존 note 키를 이 줄 끝으로 이동.)
- i18n: 강점/주의/보통 라벨은 **관심목록·기존 렌즈 UI에서 쓰는 키가 있으면 재사용**, 없으면 신규 `board.legendPos`/`legendWarn`/`legendFlat`(ko 강점/주의/보통 · en Strength/Caution/Neutral — 단, **기존 en 렌즈 화면에서 이미 쓰는 용어가 있으면 그것과 통일**·새 용어 발명 금지). ko/en 동시(패리티).

## 수정 2 — `components/toolbox/LensPreview.tsx` (PC 미리보기 카드 범례)

"TR-AI 렌즈" 섹션 제목 행을 `justify-between`으로 — 제목(좌) + 범례(우측 정렬·11~12px muted):
```
'|' TR-AI 렌즈                    ● 강점  ● 주의  ● 보통
```
- 위와 같은 i18n 키 재사용. 모바일에서 LensPreview가 쓰이는 자리(종목 선택 시)도 동일하게 나옴 — 무해(오히려 일관).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(패리티) · `npm run build`
2. 로컬 브라우저: 데스크톱 — 컬럼 도트만·현재가와 안 겹침(좁은 창에서도)·미리보기 카드 제목 우측 범례 / 모바일 뷰 — 행 2줄+이름 옆 도트·안내 2줄(힌트+범례)·`/en` 영어 확인
3. 커밋·푸시:
   ```bash
   git add components/toolbox/MarketBoard.tsx components/toolbox/LensPreview.tsx messages/ko.json messages/en.json docs/STEP_756B_COMMAND.md
   git commit -m "STEP 756b: dots-only lens column/rows, legend in preview card (PC) and hint line (mobile)"
   git push
   ```

## 완료 보고 → Cowork에게
- tsc/vitest/build + 커밋 해시. 배포 후 라이브 확인은 Cowork+사용자(폰).
