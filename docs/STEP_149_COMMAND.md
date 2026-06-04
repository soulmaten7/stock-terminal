<!-- 2026-06-04 -->
# STEP 149 — 홈 빈 섹션 CTA 문구 개선 (참여 유도)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음 Claude Code 에서: `@docs/STEP_149_COMMAND.md 파일 내용대로 실행해줘`

## 목표
홈의 핵심 참여 섹션(HOT 토론·HOT 평가 글)이 **아직 글이 없을 때** 안내 문구만 덩그러니 있던 것을, **클릭해서 갈 CTA 버튼**과 더 따뜻한 문구로 개선. (PLAYBOOK §11 P0 — 빈 섹션, 신뢰 톤)
> 신뢰 플랫폼 원칙: 가짜 글을 심지 않는다. 대신 "직접 첫 글을 남기도록" 유도.

## 전제 상태 (이 커밋 위에서 작업)
- HEAD: `5d71f04` (STEP 147 docs)
- 빌드: ✓ / 브랜치: `main`
- 변경 파일 2개. EmptyState 컴포넌트는 이미 `action` prop(버튼 영역) 지원 — 컴포넌트 수정 불필요.

## 설계
- `EmptyState` 의 `action` prop 에 `<Link>` CTA 버튼 추가 (두 모듈 모두 `Link` 이미 import 됨 → 새 import 0).
- 버튼 스타일: `bg-unjong-primary text-white rounded-full`(HomeIndexBar 탭과 동일 검증된 클래스).
- 데이터 있을 때 동작 100% 불변 — 빈 상태(EmptyState)만 바뀜.

---

## 작업 1/2 — `components/home-v5/HotDiscussionsModule.tsx` (한 줄 찾아 교체)

**찾기:**
```tsx
        <EmptyState icon="💬" title="첫 토론을 남겨보세요" description="종목 페이지에서 작성 가능." />
```
**바꾸기:**
```tsx
        <EmptyState
          icon="💬"
          title="첫 토론을 남겨보세요"
          description="종목 페이지에서 솔직한 의견을 나눌 수 있어요."
          action={
            <Link
              href="/kr"
              className="inline-block text-xs font-semibold text-white bg-unjong-primary rounded-full px-3 py-1.5 hover:opacity-90 transition-opacity"
            >
              종목 보러 가기 →
            </Link>
          }
        />
```

---

## 작업 2/2 — `components/home-v5/HotReviewPostsModule.tsx` (한 줄 찾아 교체)

**찾기:**
```tsx
        <EmptyState icon="⭐" title="첫 평가를 남겨보세요" description="상품·리딩방 페이지에서 작성 가능." />
```
**바꾸기:**
```tsx
        <EmptyState
          icon="⭐"
          title="첫 평가를 남겨보세요"
          description="상품·리딩방을 솔직하게 평가해 보세요."
          action={
            <Link
              href="/products"
              className="inline-block text-xs font-semibold text-white bg-unjong-primary rounded-full px-3 py-1.5 hover:opacity-90 transition-opacity"
            >
              평가하러 가기 →
            </Link>
          }
        />
```

---

## 작업 3/3 — 빌드 검증 + 커밋·푸시

```bash
cd ~/stock-terminal && npm run build
```

빌드 ✓ (exit 0) 확인 후:

```bash
cd ~/stock-terminal && git add components/home-v5/HotDiscussionsModule.tsx components/home-v5/HotReviewPostsModule.tsx && git commit -m "feat(v6): 홈 빈 섹션 CTA 버튼 — HOT 토론/평가 EmptyState 에 참여 유도 링크 추가 (STEP 149)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 여부
- [ ] 커밋 해시 + `git push` 성공 여부

## 주의·예상 이슈
- 두 모듈 모두 `Link` 이미 import 됨 → 새 import 불필요.
- `bg-unjong-primary`·`text-white`·`rounded-full` 은 HomeIndexBar 탭에서 쓰는 검증된 클래스.
- 데이터(토론·평가 글)가 있으면 EmptyState 자체가 안 그려짐 → 이번 변경은 빈 상태에서만 보임.
- `EmptyState` 의 `action` 은 `<div className="mt-3">{action}</div>` 로 감싸 렌더됨(컴포넌트 기존 지원).

---
> STEP 149 = PLAYBOOK §11 P0 "빈 섹션 — 참여 유도". 전제 `5d71f04` → 이 STEP 코드 커밋 후 Cowork 이 문서 갱신.
