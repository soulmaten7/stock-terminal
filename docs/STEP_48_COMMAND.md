# STEP 48 — 드로워 오버레이 제거 · 평범한 페이지 라우팅으로 회귀

**실행 명령어 (Sonnet):**
```bash
cd ~/Desktop/OTMarketing && claude --dangerously-skip-permissions --model sonnet
```

**목표**
STEP 47에서 만든 드로워 오버레이 인프라(Parallel Route `@panel` + Intercepting Route `(.)screener` + `DetailDrawer` 컴포넌트)를 전면 제거하고, 사이드바/위젯 [더보기] 클릭 시 **평범한 Next.js 페이지 이동** 으로 단순화한다. 기존 레이아웃(사이드바 + 티커바 + 푸터)은 자동으로 유지되므로 별도 작업 불필요.

**전제 상태 (이전 커밋)**
- STEP 47 완료 커밋: `c43c961`
- `app/@panel/default.tsx`, `app/@panel/(.)screener/page.tsx` 존재
- `components/common/DetailDrawer.tsx` 존재
- `app/layout.tsx`에 `panel` 파라미터 포함
- `components/common/WidgetShell.tsx` 존재 — **유지** (이미 `<Link href>` 기반 평범한 네비게이션)
- `components/widgets/ScreenerMiniWidget.tsx` 의 `router.push('/screener')` — **유지**

**왜 되돌리나**
사용자가 브라우저 테스트 후: "두번쨰 이미지 처럼 기존처럼 나오는데 URL만 바뀌는 이런걸 원한거야."
- 원했던 동작: `/net-buy` 페이지처럼 사이드바+티커바+푸터 그대로 유지되는 평범한 페이지 네비게이션
- 만들어진 동작: 오른쪽 절반을 덮는 드로워 오버레이 (배경 어둡게)
- 해결: Parallel/Intercepting Route 자체가 불필요. `<Link href>` 기본 네비게이션이 이미 원하던 동작을 수행함.

---

## Part A. `app/@panel/` 디렉토리 전체 삭제

```bash
rm -rf app/@panel
```

확인:
```bash
ls -la app/ | grep panel
# 출력 없어야 함
```

## Part B. `components/common/DetailDrawer.tsx` 삭제

```bash
rm components/common/DetailDrawer.tsx
```

확인:
```bash
ls components/common/
# DetailDrawer.tsx 없어야 함
# WidgetShell.tsx 는 유지되어야 함
```

## Part C. `app/layout.tsx` 에서 `panel` slot 제거

**현재 상태 (수정 전):**
```tsx
export default function RootLayout({
  children,
  panel,
}: {
  children: React.ReactNode;
  panel: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <div className="w-full max-w-screen-2xl mx-auto flex-1 flex flex-col">
            <Header />
            <TickerBar />
            <LayoutShell footer={<Footer />}>
              {children}
            </LayoutShell>
          </div>
          {panel}
        </AuthProvider>
      </body>
    </html>
  );
}
```

**수정 후 (이렇게 바꿔줘):**
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <div className="w-full max-w-screen-2xl mx-auto flex-1 flex flex-col">
            <Header />
            <TickerBar />
            <LayoutShell footer={<Footer />}>
              {children}
            </LayoutShell>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
```

변경점 3가지:
1. `panel` 파라미터 제거
2. 타입에서 `panel: React.ReactNode;` 제거
3. `</AuthProvider>` 직전 `{panel}` 제거

## Part D. `DetailDrawer` import 흔적 검색 (있으면 제거)

```bash
grep -r "DetailDrawer" --include="*.tsx" --include="*.ts" . | grep -v node_modules | grep -v ".next" || echo "No DetailDrawer references"
```

결과가 있으면 해당 파일을 열어서 import 문과 사용처 제거. 결과 없으면 스킵.

## Part E. `WidgetShell` 유지 확인

```bash
cat components/common/WidgetShell.tsx | head -20
```

`<Link href={detailHref}>` 가 있는지 확인. 있어야 함 (유지).

## Part F. 빌드 검증

```bash
npm run build
```

- 빌드 성공해야 함
- `@panel` 관련 에러 없어야 함
- TypeScript 에러 없어야 함

실패 시 보고하고 중단. 성공 시 Part G로 진행.

## Part G. 개발 서버 실행 (수동 검증용 — 실행만 하고 바로 중단)

Claude Code는 실행하지 말고 사용자가 직접 검증. 명령어만 안내:
```bash
# 사용자가 별도 터미널에서 실행
npm run dev -- -p 3333
```

검증 체크리스트 (사용자가 브라우저에서 확인):
- [ ] `/` 홈에서 Screener 위젯의 [더보기 →] 클릭 → URL이 `/screener` 로 바뀌고 `/net-buy` 처럼 사이드바+티커바+푸터 유지된 평범한 페이지 표시
- [ ] 사이드바 '종목 발굴' 아이콘 클릭 → 동일하게 `/screener` 로 이동, 드로워/오버레이 없음
- [ ] 사이드바 '수급' 클릭 시 `/net-buy` 가 이전처럼 정상 표시 (기존 동작 유지 확인)
- [ ] 배경 어두워지는 효과 없어야 함

## Part H. 4개 문서 헤더 날짜 업데이트

오늘 날짜(`date +%Y-%m-%d`)로 아래 4개 파일의 첫 줄 날짜를 업데이트:

1. `CLAUDE.md`
2. `docs/CHANGELOG.md`
3. `session-context.md`
4. `docs/NEXT_SESSION_START.md`

## Part I. CHANGELOG.md에 이번 세션 블록 추가

`docs/CHANGELOG.md` 맨 위(헤더 날짜 다음)에 아래 블록을 추가:

```markdown
## STEP 48 — 드로워 오버레이 제거, 평범한 페이지 라우팅으로 회귀

### 배경
STEP 47에서 Parallel Route `@panel` + Intercepting Route `(.)screener` + 우측 오버레이 `DetailDrawer` 조합을 구축했으나, 사용자 의도와 불일치. 사용자는 "URL만 바뀌고 레이아웃(사이드바+티커바+푸터)은 유지되는 평범한 페이지 이동"을 원했음. `/net-buy` 가 이미 그 패턴이었고, 그게 정답.

### 제거
- `app/@panel/` 디렉토리 전체 (`default.tsx`, `(.)screener/page.tsx`)
- `components/common/DetailDrawer.tsx`
- `app/layout.tsx` 의 `panel` parallel slot 파라미터

### 유지
- `components/common/WidgetShell.tsx` — [더보기 →] `<Link href>` 기반 평범 네비게이션. 원래부터 의도와 일치.
- `components/widgets/ScreenerMiniWidget.tsx` — `router.push('/screener')` 도 평범한 라우팅.
- STEP 47의 `link-hub` 삭제, `/filings` → `/disclosures` 정리는 그대로 유효.

### 교훈
Next.js 14+ Parallel/Intercepting Routes는 진짜 모달 오버레이 UX가 필요할 때만 쓴다. "URL은 바뀌지만 레이아웃은 유지" 는 App Router의 기본 동작이므로 별도 인프라 불필요.
```

## Part J. session-context.md 완료 블록 추가

`session-context.md` 상단 TODO 섹션 근처에 아래 블록을 추가:

```markdown
### 2026-04-22 STEP 48 완료
- [x] STEP 47 드로워 오버레이 인프라 제거
- [x] `app/@panel/` 삭제
- [x] `DetailDrawer.tsx` 삭제
- [x] `app/layout.tsx` panel slot 제거
- [x] 빌드 검증 통과
- [x] 평범한 페이지 라우팅으로 회귀 — `/net-buy` 패턴과 동일하게 동작
```

## Part K. NEXT_SESSION_START.md 업데이트

`docs/NEXT_SESSION_START.md` 를 현재 상태 기준으로 업데이트:
- 현재 상태: 평범한 페이지 라우팅 정상 동작, 위젯 [더보기 →] 클릭 시 사이드바/티커바 유지된 채 컨텐츠 영역만 전환
- 다음 할 일 후보 (STEP 49):
  - (A) 레퍼런스 플랫폼 매핑 테이블 작성 — 20+ 위젯/페이지 각각이 어느 플랫폼 UI 를 벤치마킹하는지 정리
  - (B) 사이드바 14항목 5그룹 재구성 — 카테고리 라벨 추가
  - (C) 나머지 위젯 13개에 WidgetShell 적용 + 페이지 네비게이션 연결

## Part L. Git commit + push

```bash
git add -A
git status
git commit -m "$(cat <<'EOF'
STEP 48: Remove drawer overlay, revert to plain page routing

- Remove app/@panel/ (Parallel Route + Intercepting Route)
- Remove components/common/DetailDrawer.tsx
- Remove panel slot from app/layout.tsx
- Keep WidgetShell.tsx (already uses plain <Link>)
- Keep ScreenerMini router.push (already plain routing)

User wanted URL-only change with sidebar+ticker+footer preserved,
like /net-buy page — which is the default App Router behavior.
STEP 47's drawer overlay was the wrong pattern.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
git push
```

## Part M. 최종 확인

```bash
git log --oneline -5
```

최신 커밋이 "STEP 48" 이어야 함. 종료.

---

## 체크리스트 요약 (Claude Code 용)

- [ ] Part A: `app/@panel/` 삭제
- [ ] Part B: `DetailDrawer.tsx` 삭제
- [ ] Part C: `app/layout.tsx` panel slot 제거
- [ ] Part D: `DetailDrawer` import 흔적 검색·제거
- [ ] Part E: `WidgetShell.tsx` 유지 확인
- [ ] Part F: `npm run build` 성공
- [ ] Part G: 개발 서버 실행은 사용자에게 맡김
- [ ] Part H: 4개 문서 헤더 날짜 오늘로
- [ ] Part I: CHANGELOG 블록 추가
- [ ] Part J: session-context.md 완료 블록 추가
- [ ] Part K: NEXT_SESSION_START.md 업데이트
- [ ] Part L: git commit + push
- [ ] Part M: 최종 커밋 로그 확인
