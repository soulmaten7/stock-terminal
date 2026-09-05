<!-- 2026-06-07 -->
# STEP 224 — 증권사 순위: hover 아이콘 → 항상 보이는 '바로가기' 버튼

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_224_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시)
증권사 행의 **hover 시에만 흐릿하게 뜨는 외부링크 아이콘** → **항상 보이는 '바로가기' 버튼(pill)**으로 교체(직관성·가시성). 행 전체가 이미 링크라 버튼도 같이 눌림.

## 전제 상태
- HEAD: STEP 223 상태 (행 구조는 STEP 221 이후 동일)
- 변경 1파일: `components/toolbox/BrokerRanking.tsx`
- DB 변경 0

---

## 작업 1/1 — `BrokerRanking.tsx` 행 우측: 아이콘 → '바로가기' 버튼

**찾기:**
```tsx
              {b.note && <span className="truncate text-xs text-unjong-muted">· {b.note}</span>}
              <ExternalLink size={13} className="ml-auto shrink-0 text-unjong-muted opacity-0 transition-opacity group-hover:opacity-100" />
```
**바꾸기:**
```tsx
              {b.note ? (
                <span className="min-w-0 flex-1 truncate text-xs text-unjong-muted">· {b.note}</span>
              ) : (
                <span className="flex-1" />
              )}
              <span className="flex shrink-0 items-center gap-1 rounded-md border border-unjong-border px-2 py-1 text-xs font-medium text-unjong-muted transition-colors group-hover:border-unjong-accent group-hover:bg-unjong-background group-hover:text-unjong-accent">
                바로가기
                <ExternalLink size={11} />
              </span>
```

> note(있으면 truncate)/빈 spacer가 `flex-1`로 공간을 채워 버튼을 오른쪽으로 밀어줌. 버튼은 테두리 pill(항상 보임), hover 시 강조색. `ExternalLink` 는 버튼 안에서 계속 사용.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/toolbox/BrokerRanking.tsx && git commit -m "feat(v7): 증권사 순위 행에 항상 보이는 '바로가기' 버튼 (hover 아이콘 대체) (STEP 224)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 증권사 각 행 오른쪽에 **테두리 '바로가기' 버튼**이 항상 보임(↗ 아이콘 포함)
- [ ] hover 시 버튼 강조(액센트 테두리·글자), 클릭 → 해당 증권사 새 탭
- [ ] 키움·토스처럼 note 있는 행은 note가 줄어들며(truncate) 버튼은 우측 유지
- ⚠️ 클라이언트 컴포넌트 → 하드 새로고침이면 바로 반영.

## 주의·예상 이슈
- 좁은 레일(340px)에서 키움 "20년 연속 1위" 같은 note는 버튼과 공간 경쟁 → **truncate**로 잘림(정상). note가 더 중요하면 알려주면 버튼을 아이콘+짧게 조정.
- **문서 TODO**(다음 갱신): STEP 162·215~224.

---
> STEP 224 = 증권사 '바로가기' 버튼. 전제 STEP 223. 문서 묶어 갱신.
