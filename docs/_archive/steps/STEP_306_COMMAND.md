<!-- 2026-06-20 -->
# STEP 306 — [V7 ④-10f] 컨트롤 줄을 카드 폭에 맞춤 (정렬탭 카드 오른쪽 끝 정렬)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_306_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 305. 빌드 ✓.

---

## 🎯 목표

정렬 탭이 **카드 오른쪽 끝**에 맞게(섹션 맨 오른쪽=미리보기 위가 아니라).
- 원인: 컨트롤 줄이 화면 전체 폭을 차지 → 정렬 탭이 미리보기 영역 위까지 밀림.
- 해결: 컨트롤 줄을 **본문과 동일한 칼럼 구조**(`flex gap-4` + `flex-1` + `w-72`)로 감쌈. → 정렬·등록이 **리스트 칼럼 안에서 우측정렬 = 카드 오른쪽 끝**. 미리보기 위는 빈 칸 → **카드·미리보기 상단 정렬 유지.**

```
[ 플랫폼탭 ········ 정렬·등록 ]  [ (빈칸) ]
[ 카드 리스트              ]  [ 미리보기 ]
```

> `AdvisorDirectory.tsx` 1곳(컨트롤 줄 전체 교체).

---

## 📄 `components/toolbox/AdvisorDirectory.tsx`

**찾기:**
```tsx
      {/* 플랫폼 탭(왼쪽) + 리딩방 등록 버튼(오른쪽) */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 overflow-x-auto">
          {PLATFORMS.map(([p, label]) => (
            <button
              key={p}
              type="button"
              onClick={() => { setQ(''); setPlatform(p); }}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                platform === p && !searching ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex gap-1">
            {SORTS.map(([s, label]) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  sort === s ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => { if (!isLoggedIn) { setLoginNotice(true); return; } setRegistering(true); }}
            className="shrink-0 rounded-lg border border-unjong-accent px-3 py-1.5 text-xs font-semibold text-unjong-accent transition-colors hover:bg-unjong-accent hover:text-white"
          >
            + 리딩방 등록
          </button>
        </div>
      </div>
```
**바꾸기:**
```tsx
      {/* 컨트롤 줄 — 본문과 동일 칼럼 구조(리스트폭 + 미리보기폭). 정렬·등록을 카드 오른쪽 끝에 맞춤. */}
      <div className="mb-2 flex gap-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 overflow-x-auto">
            {PLATFORMS.map(([p, label]) => (
              <button
                key={p}
                type="button"
                onClick={() => { setQ(''); setPlatform(p); }}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  platform === p && !searching ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex gap-1">
              {SORTS.map(([s, label]) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSort(s)}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    sort === s ? 'bg-unjong-primary text-white' : 'text-unjong-muted hover:bg-unjong-background'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => { if (!isLoggedIn) { setLoginNotice(true); return; } setRegistering(true); }}
              className="shrink-0 rounded-lg border border-unjong-accent px-3 py-1.5 text-xs font-semibold text-unjong-accent transition-colors hover:bg-unjong-accent hover:text-white"
            >
              + 리딩방 등록
            </button>
          </div>
        </div>
        <div className="hidden w-72 shrink-0 lg:block" />
      </div>
```

> 핵심: 바깥을 `flex gap-4`로, 컨트롤을 `flex-1`로, 끝에 `w-72` 빈 칸 추가 — 본문의 `flex gap-4` + `flex-1` + `aside w-72`와 **정확히 같은 폭**이라 정렬·등록이 카드 오른쪽 끝과 일직선.

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333) — **데스크탑(lg 이상)** 기준:
1. **정렬 탭·등록 버튼이 카드 오른쪽 끝**(♡·신고·바로가기 아이콘 줄)과 **세로로 일직선**. 미리보기 영역 위로 안 넘어감.
2. **미리보기 박스 상단 = 1번 카드 상단** (그대로 정렬 유지).
3. 모바일(좁은 폭)에선 미리보기 칸이 없으니 컨트롤이 전체 폭 사용(정상).

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 리딩방 컨트롤 줄을 본문 칼럼폭에 맞춰 정렬탭 카드 오른쪽 끝 정렬 (STEP 306)" && git push
```

---

> **한 줄 요약**: 컨트롤 줄을 본문(리스트+미리보기) 칼럼 구조와 동일하게 감싸서, 정렬·등록을 카드 오른쪽 끝에 일직선으로 + 상단 정렬 유지.
