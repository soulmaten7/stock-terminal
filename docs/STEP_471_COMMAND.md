<!-- 2026-06-30 -->
# STEP 471 — 헤더 '코인' = 평소엔 일반 탭, 클릭 시 '준비 중' 팝오버 (항상 뜨던 뱃지 제거)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_471_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
헤더에 `주식  코인 [준비중]`처럼 **'준비중' 뱃지가 항상 떠 있는 것**을 제거 → 평소엔 `주식 코인` 두 탭만 깔끔하게. **코인을 클릭하면** 그때 작은 **"준비 중" 팝오버**가 뜨고(바깥 클릭 시 닫힘), 코인은 화이트 톤 일반 탭으로 보이되 페이지 이동은 막음.

## 전제
- 최신 main + 469 적용 상태(STEP 470 미적용 가정). `components/layout/Header.tsx` 3곳 수정. 클라이언트 → HMR.

---

## (1) `coinOpen` 상태 + `coinRef` 추가 — 찾기:
```tsx
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
```
바꾸기:
```tsx
  const [langOpen, setLangOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [coinOpen, setCoinOpen] = useState(false); // '코인' 클릭 시 준비중 안내 팝오버
  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const coinRef = useRef<HTMLDivElement>(null);
```

## (2) 바깥 클릭 시 팝오버 닫기 — 찾기:
```tsx
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
```
바꾸기:
```tsx
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (coinRef.current && !coinRef.current.contains(e.target as Node)) setCoinOpen(false);
```

## (3) 준비중 탭 = 클릭 시 팝오버 — 찾기:
```tsx
            if (!m.ready) {
              return (
                <span
                  key={m.label}
                  className="flex shrink-0 cursor-not-allowed items-center gap-1 px-3 py-2 text-sm font-medium text-white/30"
                  title="준비 중"
                >
                  {m.label}
                  <span className="text-[10px] font-normal text-white/30">준비중</span>
                </span>
              );
            }
```
바꾸기:
```tsx
            if (!m.ready) {
              return (
                <div key={m.label} ref={coinRef} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setCoinOpen((o) => !o)}
                    aria-haspopup="true"
                    aria-expanded={coinOpen}
                    className="px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
                  >
                    {m.label}
                  </button>
                  {coinOpen && (
                    <div className="absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-unjong-border bg-unjong-surface px-3 py-1.5 text-xs font-medium text-unjong-primary shadow-lg">
                      준비 중이에요
                    </div>
                  )}
                </div>
              );
            }
```

---

## 확인 (HMR — 새로고침)
- 헤더에 `주식  코인` 두 탭만 깔끔하게(항상 뜨던 '준비중' 뱃지 없음). 코인은 화이트 톤.
- **코인 클릭 → 바로 아래 작은 "준비 중이에요" 팝오버** 표시. 한 번 더 누르거나 바깥 클릭하면 닫힘.
- 코인은 페이지 이동 안 함(버튼이라 href 없음).
- 빌드 에러 없음.

## 빌드·커밋
- 보류. 469 + 471 묶어서 커밋·배포.
