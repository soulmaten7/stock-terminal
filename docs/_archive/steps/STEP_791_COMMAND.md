# STEP 791 — 파트 헤더에 "7가지가 무엇인지" 명시 (목록 + 소개 링크)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: STEP 790 커밋 `886d425` + 문서 `bf18ddc` 이후 HEAD · 트리 클린

**배경(07-22 · 폰 실물)**: 788 파트 헤더가 **"7가지 방법으로 따로 보기"라고 선언만 하고 그 7가지가 무엇인지 화면 어디에도 없음.** `StockLens.readingGuide`("읽는 법")는 신뢰도 등급만 설명하고, 787이 카드별 "이게 뭐예요?"(`L.summary`)를 제거하면서 접힘 상태의 방법 설명도 사라짐 → 사용자가 카드를 하나씩 열어야만 7가지를 알 수 있음(787 설계 누락).

---

## 수정

### 1) 파트 헤더 확장 — 7개 목록 노출

`StockLensClient.tsx`의 788 파트 헤더 블록:

- 제목(현행 유지): **"7가지 방법으로 따로 보기"**
- **신설 — 목록 줄**: 렌즈 7개의 쉬운 라벨을 `·`로 연결해 표시.
  `오름세 · 단기 흐름 · 가격 대비 가치 · 돈 버는 힘 · 몸집 관리 · 가격 출렁임 · 재무 건전성`
  - **788에서 만든 `lensShortLabel(locale, key)`을 그대로 재사용**(새 문구 작성 금지 — 아래 카드 라벨과 100% 일치해야 목차 역할을 함).
  - 순서는 **화면에 실제로 렌더되는 카드 순서와 동일**해야 함(`lib/lenses/registry.ts` 순서 + fscore 위치 기준 — 하드코딩 배열 금지, 실제 렌더 목록에서 도출).
  - 스타일: 13px·`text-unjong-primary/90`·`leading-relaxed`(모바일에서 2줄로 자연 줄바꿈 허용·`truncate` 금지).
- 부제(현행 문구 교체): **"기관과 학계에서 검증된 기법 7개가 이 종목을 저마다 어떻게 보는지 — 방법이 궁금하면 소개 →"**
  - `소개`는 `/about`으로 가는 링크(`@/i18n/navigation`의 `Link` 사용·로케일 유지·새 탭 아님).
  - en 패리티: `Seven proven methods, each reading this stock its own way — see how they work →`(기존 en 톤 정합·새 브랜드 용어 발명 금지).
- 렌즈가 7개 미만으로 렌더되는 종목(데이터 결측·F-Score 미지원 등)에서는 **실제 개수로 문구가 맞아야 함** — "7가지"를 하드코딩하지 말고 렌더 개수 기반(ICU `{n}`)으로. 목록도 실제 렌더된 것만.

### 2) 스코프 밖(손대지 말 것)

- 카드 내부 구조(787/789 결과)·`readingGuide` 내용·`/about` 본문·788 닫는 카드 — 전부 불변.
- `L.summary` 되살리기 금지(이번엔 파트 헤더로 해결하고, 부족하면 후속에서 판단).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(ko/en 패리티·ICU) · `npm run build`
2. 라이브 모바일 375px: 파트 헤더에 7개 라벨이 카드 순서대로 · 라벨이 아래 각 카드/788 닫는 카드 분류와 **완전히 같은 문자열** · 줄바꿈 자연스러움 · `소개` 링크 → `/about` 이동(로케일 유지).
3. 렌즈 결측 종목(F-Score 미지원 US 종목 또는 KB금융류) — 개수·목록이 실제 렌더와 일치.
4. `/en` 영어 목록·링크 확인.
5. 커밋:
   ```bash
   git add app/ components/ lib/ messages/ docs/STEP_791_COMMAND.md
   git commit -m "STEP 791: list the seven methods in the lens part header with link to about"
   git push
   ```

## 완료 보고 → Cowork에게: 라이브 확인(개수 분기 포함) + 커밋 해시.
