<!-- 2026-06-30 -->
# STEP 463 — 인증 리딩방 빈 화면 → 운영자 온보딩 CTA (공급 깔때기)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_463_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
리딩방·검증 "인증 리딩방" 탭이 지금은 비어있을 때 밋밋한 한 줄만 떠. → **운영자 온보딩 CTA 카드**로 바꿔서, 리딩방 운영자가 "아 인증하면 무료로 게재되는구나"를 보고 `/business`로 들어오게(공급 유입 = 수익 출발점).

## 전제
- 최신 main(HEAD `37d9676` + 462). `AdvisorDirectory.tsx` 1곳 수정. 클라이언트 → **HMR**.

---

## `components/toolbox/AdvisorDirectory.tsx` — 빈 상태 교체
찾기:
```tsx
          ) : results.length === 0 ? (
            <p className="py-10 text-center text-sm text-unjong-muted">
              {searching
                ? '검색 결과가 없습니다. 신고되지 않은 업체일 수 있으니 주의하세요.'
                : view === 'verified'
                ? '아직 인증된 리딩방이 없어요. 운영자가 본인 업체를 인증하면 여기에 표시됩니다.'
                : '등록된 곳이 없습니다.'}
            </p>
          ) : (
```
바꾸기:
```tsx
          ) : results.length === 0 ? (
            searching ? (
              <p className="py-10 text-center text-sm text-unjong-muted">검색 결과가 없습니다. 신고되지 않은 업체일 수 있으니 주의하세요.</p>
            ) : view === 'verified' ? (
              <div className="mt-2 rounded-xl border border-unjong-border bg-unjong-surface p-6 text-center">
                <p className="text-sm font-semibold text-unjong-primary">아직 인증된 리딩방이 없어요.</p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-unjong-muted">본인 리딩방이세요? 금감원 유사투자자문 신고 + 운영자 인증을 마치면 <b className="text-unjong-accent">무료로 게재</b>돼요.</p>
                <button
                  type="button"
                  onClick={() => { if (!isLoggedIn) { setLoginNotice(true); return; } router.push('/business'); }}
                  className="mt-4 inline-flex items-center gap-1 rounded-lg bg-unjong-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  리딩방 등록·관리 <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-unjong-muted">등록된 곳이 없습니다.</p>
            )
          ) : (
```

> `ChevronRight`·`router`·`isLoggedIn`·`setLoginNotice`는 이미 이 컴포넌트에 있음(추가 import 불필요).

---

## 확인 (HMR — 새로고침)
- 리딩방·검증 → **인증 리딩방** 탭(지금 0개) → 밋밋한 한 줄 대신 **온보딩 카드** + "리딩방 등록·관리 →" 버튼. 클릭 시 `/business`(비로그인은 로그인 안내).
- 금감원 등록업체 / 관심도순 / 검색 빈 상태는 기존 그대로.
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 파이널라이즈 STEP들 묶어 커밋.
