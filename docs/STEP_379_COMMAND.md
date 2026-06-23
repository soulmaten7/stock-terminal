<!-- 2026-06-24 -->
# STEP 379 — [모바일 ③] 증권사(표 아래)·리딩방·피드 폴리시

> 📱 마스터 플랜 `docs/MOBILE_BUILD_PLAN.md`. **데스크탑 클래스 삭제 금지.** 빌드 통과 시에만 커밋.

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_379_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
① **증권사 바로가기**가 모바일에선 `lg:block`이라 완전히 안 보임 → **표 아래에 표시**(데스크탑은 우측 aside 그대로).
② NewsFeed 대표 이미지 모바일에서 약간 축소.
③ 리딩방 모바일 바텀시트 패딩 미세.

> 리딩방(AdvisorDirectory)은 이미 모바일 처리(바텀시트·`lg:hidden` 등록버튼)가 돼 있어 큰 변경 없음.

변경 3파일: `MarketBoard.tsx`, `NewsFeed.tsx`, `AdvisorDirectory.tsx`.

---

## ① `components/toolbox/MarketBoard.tsx` — 모바일 증권사 섹션(표 아래)

찾기:
```tsx
        </aside>
      </div>
    </section>
```
바꾸기:
```tsx
        </aside>
      </div>

      {/* 모바일: 증권사 바로가기 (표 아래 — 데스크탑은 우측 aside) */}
      <div className="mt-5 lg:hidden">
        <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
        <p className="border-b border-unjong-border px-1 py-2 text-[11px] text-unjong-muted">최근 분기 거래대금순</p>
        <BrokerRanking hideHeader />
      </div>
    </section>
```
> `BrokerRanking`은 이미 import돼 있음(상단 aside에서 사용 중). 데스크탑은 `lg:hidden`이라 안 보이고 기존 우측 aside만, 모바일은 이 섹션만 보임.

## ② `components/toolbox/NewsFeed.tsx` — 대표 이미지 모바일 축소
찾기:
```tsx
          <img src={featured.image} alt="" referrerPolicy="no-referrer" loading="lazy" className="h-36 w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
```
바꾸기:
```tsx
          <img src={featured.image} alt="" referrerPolicy="no-referrer" loading="lazy" className="h-32 w-full object-cover sm:h-36" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
```

## ③ `components/toolbox/AdvisorDirectory.tsx` — 모바일 바텀시트 패딩
찾기:
```tsx
          <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl border-t border-unjong-border bg-unjong-surface p-4">
```
바꾸기:
```tsx
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border-t border-unjong-border bg-unjong-surface p-3 sm:p-4">
```

---

## ✅ 빌드 + 커밋
```bash
cd ~/stock-terminal && npm run build
```
무에러 시:
```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(mobile): 증권사 바로가기 표 아래 노출(모바일) + 뉴스 이미지·바텀시트 폴리시 (STEP 379)" && git push
```
> 빌드 실패 시 커밋 말고 에러 출력 후 멈춤(다음 STEP 진행 가능).

## 🌅 아침 확인
- 375px 종목·상품 탭: 표 아래에 **증권사 바로가기** 목록 보임. ≥1024px: 예전처럼 우측에.
- 리딩방 항목 탭 → 하단 바텀시트 미리보기(⭐ 포함) 정상.

---

> **한 줄 요약**: 모바일에서 사라졌던 증권사 리스트를 표 아래로 복구 + 뉴스 이미지·바텀시트 미세. 데스크탑 불변.
