<!-- 2026-07-13 -->
# STEP 704 — 다크 테마 1/3단계: 토큰화 (겉모습 변화 0)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**목표:** 하드코딩 색·역할충돌 토큰을 전부 토큰으로 정리해서, 2단계(값 플립)에서 앱 전체가 **한 번에** 깔끔히 다크로 뒤집히도록 준비. ⚠️ **이 단계는 화면이 하나도 안 변해야 한다(값이 동일하므로).**
**전제:** 최신 main (직전 커밋 = `/about` 폭 `e5c4a97`).

---

## 배경 (왜 이 순서인가)
- 색 토큰은 `app/globals.css`의 `@theme inline`에 있음. **정상 토큰**(`bg-unjong-background`·`bg-unjong-surface`·`text-unjong-primary`·`border-unjong-border` 등)은 52파일 **554곳** — 2단계에서 값만 뒤집으면 **자동 전환**(안전 다수).
- 지금 손봐야 할 **진짜 위험 2가지:**
  1. **역할 충돌:** `unjong-primary`(#0E1116)를 본문 글자(`text-unjong-primary`, 100+곳)와 **어두운 버튼·활성탭 배경**(`bg-unjong-primary`, 40+곳)에 **겸용**. 2단계에서 이 토큰 값을 밝은 글자색으로 뒤집으면 **버튼 배경 40여 곳이 깨진다.**
  2. **하드코딩 흰 배경:** `bg-white` ~22곳(렌즈·폼·로고)이 다크에서 **흰 섬**으로 남는다.
- **해결(이번 단계):** 배경 전용 토큰 `unjong-strong` 신설(값은 지금과 **동일** #0E1116) + `bg-white`→`bg-unjong-surface` 토큰화. **값이 같아서 겉모습 0 변화**, 하지만 2단계 플립이 안전해짐.

---

## 작업

### 1. globals.css — 배경 전용 토큰 추가 (값 동일)
`app/globals.css`의 `@theme inline { … }` 안, `--color-unjong-primary: #0E1116;` **바로 아래 줄**에 추가:
```css
  --color-unjong-strong: #0E1116; /* 어두운 버튼·활성탭 배경 전용 (text-unjong-primary와 역할 분리). 2단계에서 다크 값 별도 지정 */
```

### 2. 역할충돌 해소 — `bg-unjong-primary` → `bg-unjong-strong` (전 파일)
배경 용도(`bg-`)만 새 토큰으로. 글자(`text-unjong-primary`)는 **건드리지 않음**.
```bash
cd ~/stock-terminal
grep -rl 'bg-unjong-primary' app components | xargs sed -i '' 's/bg-unjong-primary/bg-unjong-strong/g'
```
> `hover:bg-unjong-primary`·`bg-unjong-primary/30`(틴트)도 함께 치환됨 — 정상. `text-unjong-primary`는 문자열이 달라 안 건드림.

### 3. 하드코딩 흰 배경 토큰화 — `bg-white` → `bg-unjong-surface` (전 파일)
```bash
grep -rl 'bg-white' app components | xargs sed -i '' 's/bg-white/bg-unjong-surface/g'
```
> `bg-white/90`·`hover:bg-white`도 함께 치환됨 — 정상.

### 4. 검증 (겉모습 0 변화여야 함)
```bash
npm run build
grep -rn 'bg-unjong-primary' app components   # → 0건 (전부 strong으로)
grep -rn 'bg-white' app components             # → 0건 (전부 surface로)
```
- 빌드 성공 확인.
- 값(strong=#0E1116=옛 primary, surface=#FFFFFF=옛 white)이 동일 → **화면은 이전과 100% 똑같아야 함.** (다르면 잘못된 것)

### 5. 커밋
```bash
git add -A && git commit -m "dark(1/3): 토큰화 — bg-unjong-primary→strong(글자/배경 역할분리)·bg-white→surface (겉모습 변화 0, 2단계 플립 준비)" && git push
```

---

## 다음 (미리보기, 이번엔 X)
- **STEP 705 (2/3 플립):** `globals.css` 토큰 **값만** 다크로 — `background:#0A0A0A`·`surface:#1C1C1E`·`primary(글자):#E9EAEC`·`strong(다크 버튼값):민트 or 밝은 표면`·`border:#2C2C2E`·`muted:#8A8D93` + `body`·`html color-scheme:dark`·스크롤바 3색. → **홈 보드 라이브 검증.** (이미 정의된 미사용 `unjong-dark-*` 토큰 재활용)
- **STEP 706 (3/3 폴리시):** 표면별 대비 QA — `bg-amber-50` warn fill·`text-emerald/amber` 상태색·accent 틴트 알파 상향·`.shadow-soft`→보더/글로우·슬라이더 흰 링·StockLogo/구글버튼 특수처리.
