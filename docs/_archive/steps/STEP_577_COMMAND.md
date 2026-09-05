<!-- 2026-07-04 -->
# STEP 577 — 6개 공용 렌즈 카드에 표시 헌장 적용 (F-Score 템플릿 확산)

> **목표**: 나머지 6개 렌즈(모멘텀·저변동·기술·밸류·퀄리티·자산성장)가 공유하는 **공용 카드 템플릿** 한 곳을 고쳐 **6개 동시** 헌장 적용 — 이름 크게 + [등급] + "· 기능" · 접힘=메뉴(이름+배지+기능+한 줄 설명) · 펼침="이게 뭐예요?" 박스로 승격(접힘 설명은 펼치면 숨김·중복 방지) · 스펙트럼·이 기법 방향·근거수치·자세히는 유지(근거수치 그대로 노출). F-Score도 접힘 설명 추가해 7장 일관.
> **전제 HEAD**: `6da2c54`(STEP 576). Cowork이 page.tsx 수정 완료 → Claude Code는 **빌드 + 클린 재시작 + 커밋**. 눈검수는 Cowork이 배포 후.
> ⚠️ 페이지 라우트 변경 → 클린 재시작.

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_577_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 Cowork이 이미 수정 (`app/stock/[symbol]/page.tsx`, 소스 1파일)
- 공용 6카드: 이름 `text-lg`·기능 "· {name}" muted·접힘 설명 `{!isOpen}`·펼침 top "이게 뭐예요?" 박스({L.summary}).
- F-Score: 접힘 설명 `{!open}` 추가(일관).

## 0) 배선 확인
```bash
cd ~/stock-terminal
grep -c "이게 뭐예요" "app/stock/[symbol]/page.tsx"        # 3 (박스2 + 주석1)
grep -cE "!isOpen \? <p|!open \? <p" "app/stock/[symbol]/page.tsx"   # 2
grep -c "text-lg font-bold text-unjong-primary" "app/stock/[symbol]/page.tsx"  # 2
```
- [ ] 3 / 2 / 2.

## 1) 타입 검사 + 빌드
```bash
npx tsc --noEmit; echo "tsc EXIT=$?"
npm run build 2>&1 | grep -E "error|Error|Compiled|Failed" | head -6
```
- [ ] `tsc EXIT=0` · "Compiled successfully".

## 2) 클린 재시작 + 200
```bash
pkill -f "next dev"; rm -rf .next && npm run dev > /tmp/nextdev.log 2>&1 &
sleep 12
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3333/stock/NVDA"
```
- [ ] 200.

## 3) 커밋 + push
```bash
git add "app/stock/[symbol]/page.tsx" docs/STEP_577_COMMAND.md && git commit -m "feat(lens): 6개 공용 카드에 표시 헌장 적용(이름 크게·이게 뭐예요 박스·접힘 메뉴) + F-Score 접힘 설명 일관 (STEP 577)" && git push
```

## ✅ 여기까지 = 7장 카드 모두 헌장 골격 통일. 배포되면 Cowork 눈검수(6카드 펼침 박스·접힘 메뉴).
## ▶ 다음 = 세션 문서 대량 업데이트(STEP 570~577 반영) · 이후 렌즈별 문구 다듬기 + 기법별 유료 레퍼런스 대조.
