<!-- 2026-06-27 -->
# STEP 428 — [Phase 2 테스트] 리딩방 광고 슬롯 미리보기 (디렉토리 상단 '광고' 핀)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_428_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
Phase 2 광고 자리 그림 완성 — 리딩방·검증 탭 **목록 맨 위에 '광고' 슬롯 1개** 미리보기. (증권사 슬롯과 동일 컨셉: 사실 랭킹과 분리된 별도 핀 + '광고' 라벨 + 하이라이트.)
- **신뢰 원칙 미리보기**: 광고 행에도 **금감원 등록 배지(🛡)를 그대로** 표시 → "등록된 곳만 광고 + 광고라도 사실은 가리지 않음".
- AdvisorDirectory는 자체 `<li>` 구조라 ListRow 대신 거기에 맞춘 광고 행을 삽입(임포트된 `Globe`·`ShieldCheck`·`ExternalLink` 재사용).

## 전제
- 최신 main(STEP 427 커밋 이후). **`components/toolbox/AdvisorDirectory.tsx` 1파일** → HMR.
- **커밋 보류**(테스트 — 형태 보고 확정 후 커밋). dev 서버 끄지 말 것.
- 실제 광고주 아님(하드코딩 예시). 나중 "관리자 광고 관리 메커니즘" 만들 때 DB 연동으로 교체.

---

## `components/toolbox/AdvisorDirectory.tsx` — 목록 맨 위에 광고 행

**찾기:**
```tsx
            <ul>
              {results.map((a, i) => {
```
**바꾸기:**
```tsx
            <ul>
              {/* 🧪 TEST — 리딩방 스폰서(광고) 슬롯 예시. 사실 랭킹과 분리된 별도 핀 + '광고' 라벨. 광고라도 금감원 등록 배지는 그대로(형태 확인용, 실제 광고주 아님). */}
              <li className="flex items-center gap-3 border-b border-b-unjong-border border-l-2 border-l-unjong-accent bg-unjong-accent/[0.06] px-2 py-2.5 ring-1 ring-inset ring-unjong-accent/25">
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="shrink-0 rounded bg-unjong-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-unjong-accent">광고</span>
                  <Globe size={18} className="shrink-0 text-unjong-muted" />
                  <span className="truncate text-sm font-semibold text-unjong-primary">예시 리딩방 (광고 미리보기)</span>
                  <ShieldCheck size={13} className="shrink-0 text-emerald-600" aria-label="금감원 등록" />
                </span>
                <a href="#" onClick={(e) => e.preventDefault()} aria-label="바로가기" className="flex shrink-0 items-center rounded-md border border-unjong-border px-2 py-1 text-xs text-unjong-muted">
                  <ExternalLink size={12} />
                </a>
              </li>
              {results.map((a, i) => {
```

---

## 확인 (localhost, 커밋 X)
- **리딩방·검증 탭** → 목록 **맨 위**에 **'광고' 칩 + 민트 하이라이트** 행("예시 리딩방 (광고 미리보기)" + 🛡 금감원 등록 배지 + 바로가기).
- 그 아래 일반 리딩방 목록(금감원 등록순/관심순)은 **그대로**(순서 안 바뀜).
- 증권사 광고 슬롯이랑 **같은 톤**(광고 칩·하이라이트)인지 비교.
- 보고 피드백 주면 다듬거나, 증권사·리딩방 광고 슬롯 **둘 다 한 번에 커밋**.

## 다음(이후)
- 광고 자리 3종 중 증권사·리딩방 = 형태 확정. (증권사 '상품 광고'는 종목·상품 표 상단 — 추후.)
- 그다음 = **실제 광고 관리 메커니즘**(관리자가 DB로 광고 넣고/빼고/만료) — 하드코딩 테스트행들을 진짜로 교체.
