<!-- 2026-07-13 -->
# STEP 705 — 다크 테마 2/3단계: 플립 (globals.css 한 파일)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**목표:** STEP 704로 전부 토큰화됐으니, `app/globals.css`의 **토큰 값 + body/html/스크롤바만** 다크로 바꿔 **앱 전체를 한 번에 다크로 전환.** 다른 파일은 절대 안 건드린다.
**전제:** STEP 704 완료 (`f029d91`). 화면 변화 0인 토큰화 상태.

---

## 작업 — `app/globals.css` **만** 수정

### 1. `@theme inline` 구조색 토큰 6개 값 교체 (이름·다른 토큰은 그대로)
```
--color-unjong-background: #F5F5F7;  →  #0A0A0A   (페이지 배경 = near-black)
--color-unjong-surface:    #FFFFFF;  →  #17181C   (카드·표면)
--color-unjong-border:     #E5E7EB;  →  #2A2C31   (하드라인)
--color-unjong-primary:    #0E1116;  →  #E9EAEC   (본문 글자 = 밝게)
--color-unjong-muted:      #6B7280;  →  #8A8D93   (보조 글자)
--color-unjong-strong:     #0E1116;  →  #2C303A   (어두운 버튼·활성탭 배경 = 살짝 밝은 표면, text-white 가독 유지)
```
> ⚠️ `accent`(민트 #2DD4BF)·`up`(빨강)·`down`(파랑)·`success`·`danger`는 **이번엔 그대로 둔다** — 시맨틱색 다크 대비 미세조정은 3단계(폴리시).
> 미사용 토큰(`dark-900/800`·`text-primary` 등)도 건드리지 말 것.

### 2. body / html (최상위 스위치)
```
html { color-scheme: light; }                          →  color-scheme: dark;
body { background-color: #FFFFFF; color: #000000; }     →  background-color: #0A0A0A; color: #E9EAEC;
```

### 3. 스크롤바 (`::-webkit-scrollbar*`)
```
track  background: #FFFFFF;  →  #0A0A0A;
thumb  background: #CCCCCC;  →  #3A3D44;
thumb:hover background: #AAAAAA;  →  #4A4E56;
```

### 4. 빌드 + 커밋
```bash
npm run build
git add -A && git commit -m "dark(2/3): 플립 — globals.css 토큰 값·body·color-scheme·스크롤바 다크로 (앱 전체 다크 전환·구조색만, 시맨틱색은 3단계)" && git push
```

---

## 검증 (배포 후 — Cowork이 라이브로 직접)
- 홈 보드가 다크: 페이지 near-black, 카드·렌즈 어두운 표면, 글자 밝게, **등락 빨강·파랑·민트 그대로 살아있음.**
- 헤더(#0E1116)·푸터와 본문이 **한 톤으로 이어짐** → "위아래 따로 노는 이질감" 해소(이게 이번 개선의 핵심).
- 예상되는 거친 곳(3단계에서 처리): `bg-amber-50` 밝은 안내배너, 구글 로그인 흰 버튼, StockLogo 흰 원, `text-emerald/amber` 상태색 대비, accent 틴트 알파, `.shadow-soft`(다크선 안 보임), 슬라이더 흰 링. → **깨졌다기보다 "덜 다듬어진" 상태.** 목록화해서 STEP 706으로.

## 다음
STEP 706 (3/3 폴리시): 위 "거친 곳" + 표면 대비 QA 일괄 정리.
