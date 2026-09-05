<!-- 2026-06-20 -->
# STEP 309 — [UI] 네이티브 드롭다운 다크모드 깨짐 수정 (color-scheme: light)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_309_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 308. 빌드 ✓.

---

## 🎯 목표

신고 사유 등 `<select>` 드롭다운을 열면 **OS 다크모드 때문에 어둡게(검정 배경) 렌더**되어 밝은 모달과 안 맞음.
→ `html`에 **`color-scheme: light`** 선언 = OS가 다크여도 **모든 네이티브 컨트롤(드롭다운·입력·달력 등)이 밝게(화이트~연그레이)** 렌더. 한 줄로 전역 해결.

> `app/globals.css` 1곳.

---

## 📄 `app/globals.css`

**찾기:**
```css
html {
  /* STEP 127: 13px → 16px (브라우저 기본). rem 기반 Tailwind 텍스트·spacing 이
     네이버 페이 증권 수준 크기(text-xs=12px / text-sm=14px / text-base=16px)로 정렬됨. */
  font-size: 16px;
}
```
**바꾸기:**
```css
html {
  /* STEP 127: 13px → 16px (브라우저 기본). rem 기반 Tailwind 텍스트·spacing 이
     네이버 페이 증권 수준 크기(text-xs=12px / text-sm=14px / text-base=16px)로 정렬됨. */
  font-size: 16px;
  /* 라이트 테마 고정 — OS가 다크모드여도 네이티브 컨트롤(select 드롭다운·입력창)을 밝게 렌더 */
  color-scheme: light;
}
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333):
1. 리딩방·검증 → 카드 **신고** → **신고 사유 드롭다운** 열기 → **흰색~연회색 밝은 배경**(검정 깨짐 없음).
2. 자가등록 폼의 플랫폼 드롭다운, 기타 입력창도 밝게.

> 참고: macOS를 라이트모드로 바꿔도 해결되지만, 이 선언은 **사용자 OS와 무관하게 항상 밝게** 만들어줌.

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "fix(ui): html color-scheme: light — OS 다크모드에서 네이티브 드롭다운 깨짐 수정 (STEP 309)" && git push
```

---

> **한 줄 요약**: `html { color-scheme: light }` 추가 → OS 다크모드여도 select 드롭다운 등 네이티브 컨트롤이 밝게 렌더(모달과 일치).
