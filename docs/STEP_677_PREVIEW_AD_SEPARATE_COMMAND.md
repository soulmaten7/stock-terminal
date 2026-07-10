<!-- 2026-07-10 -->
# STEP 677 — 🧱 미리보기 광고를 AI 카드 밖으로 분리 (신뢰) + 모바일 하단 광고 블록

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** STEP 676 후. `LensPreview.tsx` 133~159행 — "전체 렌즈·근거 보기" CTA **바로 아래, 같은 AI 카드 안**에 어필리에이트 + `preview_banner_pc`(광고 문의하기)가 들어있음.
**문제:** AI 렌즈 카드 **안**에 "광고 문의하기"가 붙어 있어 **AI 결과까지 광고처럼 보여 신뢰가 깎임.**
**목표:** 광고(어필리에이트 + preview_banner_pc)를 **AI 카드 밖으로 분리**. ① **PC**: 미리보기 카드 아래 **별도 카드**로. ② **모바일(compact)**: 종목 시트 **맨 아래 구분선 + "광고" 라벨 블록**(전면광고 금지). → AI 카드는 100% 우리 콘텐츠(+우리 CTA "전체 렌즈보기")만.
**대상:** `components/toolbox/LensPreview.tsx` (이 파일만. 6개 보드 공유라 전 국가 동시 반영).
**설계 근거:** `docs/AD_MONETIZATION_PLAYBOOK.md` §0-2(신뢰가 광고보다 위)·§2 슬롯(sheet_native_mobile = 시트 내부 네이티브, interstitial 금지).

---

## 1. 반환부를 Fragment로 감싸기
현 66~67행:
```tsx
  return (
    <div className={compact ? '' : 'rounded-2xl border border-unjong-border bg-white p-4'}>
```
→ 여는 `<>` 추가:
```tsx
  return (
    <>
    <div className={compact ? '' : 'rounded-2xl border border-unjong-border bg-white p-4'}>
```

## 2. 133~162행 전체 교체 ("전체 렌즈보기" Link ~ 파일 끝)
현재(133~162행): Link → 어필리에이트 → preview_banner_pc가 **카드 `</div>`(160행) 안**에 있음.
→ **카드를 Link 직후 닫고**, 광고 블록을 **카드 밖**으로 빼고, Fragment 닫기:

```tsx
      <Link href={`/stock/${stock.symbol}`} className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-unjong-accent/10 py-2 text-[12px] font-semibold text-unjong-accent hover:bg-unjong-accent/15">
        전체 렌즈·근거 보기 →
      </Link>
    </div>

    {/* ── 광고 영역 — AI 카드 밖(신뢰 분리). PC=별도 카드 / 모바일=시트 하단 구분선+'광고' 라벨 ── */}
    {(() => {
      const affs = liveAffiliates('ko').slice(0, 1);
      const sold = soldCreative('preview_banner_pc', 'ko');
      const inner = (
        <>
          {affs.map((aff) => (
            <a key={aff.broker_id} href={aff.href} target="_blank" rel="noopener noreferrer nofollow sponsored"
               className="flex items-center justify-center gap-1 rounded-lg border border-unjong-border py-2 text-[12px] font-semibold text-unjong-primary hover:border-unjong-accent hover:text-unjong-accent">
              {aff.label} <ExternalLink size={12} />
              <span className="ml-1 rounded bg-unjong-background px-1 text-[9px] text-unjong-muted">광고</span>
            </a>
          ))}
          {sold ? (
            <a href={sold.href} target="_blank" rel="noopener noreferrer nofollow sponsored"
               className="block rounded-lg border border-unjong-border p-2 text-center text-[12px] text-unjong-primary hover:border-unjong-accent">
              {sold.label}
              <span className="ml-1 rounded bg-unjong-background px-1 text-[9px] text-unjong-muted">광고</span>
            </a>
          ) : (
            <Link href="/advertise?slot=preview_banner_pc"
               className="flex items-center justify-center gap-0.5 rounded-lg border border-dashed border-unjong-border py-2 text-[11px] text-unjong-muted transition-colors hover:text-unjong-accent">
              광고 문의하기 <ChevronRight size={12} />
            </Link>
          )}
        </>
      );
      return compact ? (
        // 모바일: 시트 맨 아래 구분선 + '광고' 라벨 (별도 레일 없음 → 시각 분리로 신뢰 유지)
        <div className="mt-4 border-t border-unjong-border pt-3">
          <p className="mb-1.5 text-[10px] text-unjong-muted">광고</p>
          {inner}
        </div>
      ) : (
        // PC: 미리보기 카드 아래 별도 카드
        <div className="mt-3 rounded-2xl border border-unjong-border bg-white p-3">
          {inner}
        </div>
      );
    })()}
    </>
  );
}
```

> 핵심: `</div>`(카드 닫기)를 "전체 렌즈보기" Link **직후**로 옮김 → AI 카드엔 우리 콘텐츠만. 광고는 카드 밖 별도 블록. 어필리에이트는 여전히 live 0개라 안 뜸(정상).

## 3. 검증 → 커밋
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && npm run dev
```
확인:
- **PC**: 종목 선택 → AI 렌즈 카드(테두리) 안엔 "전체 렌즈·근거 보기"까지만. 그 **아래 별도 카드**에 "광고 문의하기"(점선). 두 카드가 시각적으로 분리됨.
- **모바일**: 종목 시트 맨 아래 **구분선 + "광고" 라벨 + 광고 문의하기**. AI 내용과 분리. 전면광고 없음.
- 어필리에이트 CTA 안 뜸(정상). console.log 금지. tsc 에러 0.
```bash
git add components/toolbox/LensPreview.tsx docs/STEP_677_PREVIEW_AD_SEPARATE_COMMAND.md
git commit -m "fix(ads): 미리보기 광고를 AI 카드 밖으로 분리(신뢰) — PC 별도 카드 / 모바일 시트 하단 구분선+광고 라벨"
git push
```

## 4. 세션 종료 문서 4개 헤더 날짜 오늘(2026-07-10) + CHANGELOG 한 줄(STEP 677).

## Cowork에게 보고
- PC 별도 카드 분리 + 모바일 하단 광고 블록 스크린샷 확인.
→ 다음: (a) `/advertise` 문의폼 slot 종류 반영, (b) 증권사 제휴 실제 접촉(어필리에이트 live), (c) US 등 §5 원장 다음 국가.
