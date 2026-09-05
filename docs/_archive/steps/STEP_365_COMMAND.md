<!-- 2026-06-23 -->
# STEP 365 — [출시준비] 푸터 이메일 → contact@onetrillion.app

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_365_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
구글 워크스페이스로 `contact@onetrillion.app` 메일 활성화 완료 → 푸터의 "이메일: 도메인 확정 후 안내" 자리에 실제 주소(클릭 시 메일앱 열리는 mailto)로 교체.

> 변경 1파일: `components/layout/Footer.tsx`(1줄). 컴포넌트 → **새로고침이면 충분**(재시작 불필요).

---

## 📄 `components/layout/Footer.tsx`

**찾기:**
```tsx
              <li>이메일: 도메인 확정 후 안내</li>
```
**바꾸기:**
```tsx
              <li>이메일: <a href="mailto:contact@onetrillion.app" className="transition-colors hover:text-[#2DD4BF]">contact@onetrillion.app</a></li>
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

개발 서버(컴포넌트 → 새로고침):
1. 푸터 문의에 **이메일: contact@onetrillion.app** 표시.
2. 클릭 → 메일 작성창(mailto) 열림, 호버 시 민트색.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add components/layout/Footer.tsx && git commit -m "feat(launch): 푸터 이메일 contact@onetrillion.app (mailto) 반영 (STEP 365)" && git push
```

---

> **한 줄 요약**: 푸터 이메일을 실제 주소 contact@onetrillion.app(mailto 링크)로. 메일 셋업 완료 반영. 컴포넌트라 새로고침.
