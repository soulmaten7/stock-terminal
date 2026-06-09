<!-- 2026-06-07 -->
# STEP 215 — 시장 시간 안내 바를 랭킹 탭 줄 오른쪽으로 이동

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_215_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시)
지금 **왼쪽 컬럼 맨 위에 한 줄 차지**하는 시장 상태바(`● 국내 애프터마켓 15:30~20:00  ● 해외 프리마켓 17:00~22:30`)를
**랭킹 탭 줄(실시간 차트 … 주식 관련 채널 랭킹)의 오른쪽 끝에 우측 정렬**로 이동.
- 자투리 공간 활용(토스식) → 상단 깔끔해지고 인기토론이 위로 올라옴.
- ⚠️ 좁은 화면에선 6탭과 겹치므로 **`xl` 이상에서만 표시**(좁으면 자동 숨김, 탭 우선).

## 전제 상태
- HEAD: STEP 214 (`6ef495f`) 상태
- 변경: `components/home-v6/HomeClientV6.tsx`(상태바 제거) · `components/home-v6/HomeRankingTabs.tsx`(탭 줄 우측에 추가) — 2파일
- DB 변경 0

---

## 작업 1/2 — `HomeClientV6.tsx` 에서 시장 상태바 제거

**찾기:**
```tsx
        <div className="min-w-0">
          {/* 시장 상태바 */}
          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-unjong-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F04452]" />
              국내 애프터마켓 <span className="font-medium text-unjong-primary">15:30~20:00</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F04452]" />
              해외 프리마켓 <span className="font-medium text-unjong-primary">17:00~22:30</span>
            </span>
          </div>

          {/* 인기 토론 (주요지수 박스 자리 — 지수는 상단 스트립으로 이동) */}
          <HomePopularDiscussions />
```
**바꾸기:**
```tsx
        <div className="min-w-0">
          {/* 인기 토론 (주요지수 박스 자리 — 지수는 상단 스트립으로 이동) */}
          <HomePopularDiscussions />
```

> 시장 상태바는 STEP 215에서 랭킹 탭 줄 오른쪽으로 이동 → 여기선 제거만.

---

## 작업 2/2 — `HomeRankingTabs.tsx` 탭 줄 오른쪽에 시장 시간 안내 추가

**찾기:**
```tsx
      <div className="mb-4 flex items-center gap-1 border-b border-unjong-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "-mb-px border-b-2 border-unjong-primary px-3 py-2 text-sm font-bold text-unjong-primary"
                : "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-unjong-muted hover:text-unjong-primary"
            }
          >
            {t.label}
          </button>
        ))}
      </div>
```
**바꾸기:**
```tsx
      <div className="mb-4 flex items-center gap-1 border-b border-unjong-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              tab === t.key
                ? "-mb-px border-b-2 border-unjong-primary px-3 py-2 text-sm font-bold text-unjong-primary"
                : "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-unjong-muted hover:text-unjong-primary"
            }
          >
            {t.label}
          </button>
        ))}

        {/* 오른쪽 자투리 공간: 시장 시간 안내 (넓은 화면만 — 좁으면 탭 우선) */}
        <div className="ml-auto hidden items-center gap-4 pb-2 pr-1 text-xs text-unjong-muted xl:flex">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F04452]" />
            국내 애프터마켓 <span className="font-medium text-unjong-primary">15:30~20:00</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F04452]" />
            해외 프리마켓 <span className="font-medium text-unjong-primary">17:00~22:30</span>
          </span>
        </div>
      </div>
```

> `ml-auto` 로 우측 정렬, `hidden xl:flex` 로 넓을 때만 표시. 탭 버튼은 그대로(우선순위).

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/home-v6/HomeClientV6.tsx components/home-v6/HomeRankingTabs.tsx && git commit -m "feat(v7): 시장 시간 안내 바를 랭킹 탭 줄 오른쪽으로 이동(자투리 공간·xl 이상) (STEP 215)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 왼쪽 컬럼 맨 위 **시장 상태바 사라지고** 인기토론이 위로 올라옴
- [ ] 랭킹 탭 줄 **오른쪽 끝에 `● 국내 애프터마켓 … ● 해외 프리마켓 …`** 우측 정렬로 표시(넓은 화면)
- [ ] 창 폭을 줄이면 시간 안내는 **숨고** 6탭은 정상
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 너무 자주 숨으면 `xl:flex` → `lg:flex` 로 낮추면 됨(겹침 위험 ↑).
- 시간(15:30~20:00 등)은 현재 **고정 텍스트**(실시간 계산 아님). 추후 실제 장 세션 상태로 동적화 가능.
- **문서 TODO**(다음 갱신): STEP 215.

---
> STEP 215 = 시장 시간 안내 바 → 랭킹 탭 줄 우측. 전제 STEP 214. 문서 묶어 갱신.
