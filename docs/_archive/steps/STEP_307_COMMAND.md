<!-- 2026-06-20 -->
# STEP 307 — [V7 ④-10g] 등록버튼=미리보기 칸 위 / 정렬탭=카드 끝 (분리)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_307_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 306 상태(`63d93fe`, 그 뒤 revert로 복구됨). 빌드 ✓.

---

## 🎯 목표 (사용자 다이어그램 그대로)

```
[ 플랫폼탭 ········· 정렬탭 ] [ 리딩방등록 ]   ← 정렬탭=카드 오른쪽 끝, 등록=미리보기 칸 위(오른쪽)
[ 카드 리스트 ·············· ] [ 미리보기   ]
```

- **정렬 탭** = 리스트(카드) 칼럼 안 오른쪽 끝.
- **+ 리딩방 등록** = 미리보기 칼럼(`w-72`) 위, 오른쪽 정렬. (STEP 306은 등록을 정렬과 묶어 카드 칸에 둬서 틀렸음 → 분리)
- 모바일(미리보기 칸 없음)에선 등록 버튼을 정렬 옆에(카드 칸) 표시.

> `AdvisorDirectory.tsx` 컨트롤 줄 전체 교체.

---

## 📄 `components/toolbox/AdvisorDirectory.tsx`

**찾기:**
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
**바꾸기:**
```tsx
      {/* 컨트롤 줄 — 리스트폭(플랫폼+정렬) + 미리보기폭(등록). 정렬=카드 끝, 등록=미리보기 칸 위. */}
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
            {/* 모바일 전용(미리보기 칸 없음): 등록 버튼을 정렬 옆에 */}
            <button
              type="button"
              onClick={() => { if (!isLoggedIn) { setLoginNotice(true); return; } setRegistering(true); }}
              className="shrink-0 rounded-lg border border-unjong-accent px-3 py-1.5 text-xs font-semibold text-unjong-accent transition-colors hover:bg-unjong-accent hover:text-white lg:hidden"
            >
              + 리딩방 등록
            </button>
          </div>
        </div>
        {/* 미리보기 폭: 데스크탑 등록 버튼 (오른쪽 정렬) */}
        <div className="hidden w-72 shrink-0 items-center justify-end lg:flex">
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

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333) — **데스크탑(lg 이상)**:
1. **정렬 탭**(가나다↑/↓/추천순) = 카드 리스트 오른쪽 끝(♡·신고·바로가기 줄)과 일직선.
2. **+ 리딩방 등록** = 오른쪽 미리보기 박스 바로 위, 오른쪽 정렬.
3. 미리보기 상단 = 1번 카드 상단(정렬 유지).
4. 모바일: 등록 버튼이 정렬 탭 옆(카드 칸)에 표시.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 리딩방 등록버튼=미리보기칸 위 / 정렬탭=카드끝 분리 (STEP 307)" && git push
```

---

> **한 줄 요약**: 정렬 탭은 카드 칼럼 오른쪽 끝, '+ 리딩방 등록'은 미리보기 칼럼 위(오른쪽)로 분리. (모바일은 등록을 정렬 옆에)
