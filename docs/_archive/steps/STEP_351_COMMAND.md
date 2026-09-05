<!-- 2026-06-22 -->
# STEP 351 — [리브랜드] 운종/UNJONG → Trillion/트릴리언 + 사업자정보

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_351_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
플랫폼명 확정(**Trillion / 트릴리언**, 상호=원트릴리언)에 따라 코드 전면 리네임 + 푸터 사업자정보 채우기.
- 표시 텍스트 **운종 → 트릴리언**(69곳), 워드마크 **UNJONG → Trillion**(3곳).
- ⚠️ 소문자 `unjong-` 디자인 토큰 / 코드 식별자(`UnjongSidebar`, `unjongSelectedSymbolStore`)는 **케이스가 달라 자동으로 안 건드려짐** — 그대로 둠.

---

## 📄 1) 전면 리네임 (sed 일괄 — app·components)

```bash
cd ~/stock-terminal
# 표시 텍스트 한글 브랜드
grep -rl "운종" app components | xargs sed -i '' 's/운종/트릴리언/g'
# 영문 워드마크 (대문자만 — 소문자 unjong- 토큰은 매칭 안 됨)
grep -rl "UNJONG" app components | xargs sed -i '' 's/UNJONG/Trillion/g'
```

> macOS 기준 `sed -i ''`. (리눅스면 `sed -i`.) 파일명에 공백 없으니 xargs 그대로 안전.

---

## 📄 2) 푸터 사업자정보 채우기 — `components/layout/Footer.tsx`

> (위 sed로 브랜드·카피의 '운종'은 이미 '트릴리언'으로 바뀐 상태. 이 자리표시자는 sed가 안 건드리니 별도 교체.)

**찾기:**
```tsx
          <p>상호명: [추후 입력] | 대표자: [추후 입력] | 사업자등록번호: [추후 입력] | 주소: [추후 입력]</p>
```
**바꾸기:**
```tsx
          <p>상호명: 원트릴리언 | 대표자: [추후 입력] | 사업자등록번호: 210-39-33812 | 주소: [추후 입력]</p>
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

개발 서버(컴포넌트·메타 변경 → HMR/새로고침):
1. **헤더 로고** = `Trillion 트릴리언`.
2. **푸터** = 브랜드 `Trillion 트릴리언` + 하단 `상호명: 원트릴리언 … 사업자등록번호: 210-39-33812` + `© 2026 트릴리언`.
3. 브라우저 탭 제목(메타)에 '트릴리언'.
4. 잔여 확인: `grep -rn "운종\|UNJONG" app components` → **0건**이어야 정상(소문자 `unjong-`·`Unjong` 식별자는 남아 있어도 정상).

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add -A && git commit -m "rebrand: 운종/UNJONG → Trillion/트릴리언 전면 리네임 + 푸터 사업자정보(원트릴리언·210-39-33812) (STEP 351)" && git push
```

---

> **한 줄 요약**: 플랫폼명 Trillion(트릴리언)로 전면 리브랜드 + 푸터 사업자정보 채움. 상호=원트릴리언. (포지셔닝 카피·이메일·도메인은 후속.)
