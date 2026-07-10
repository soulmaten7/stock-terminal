<!-- 2026-07-10 -->
# STEP 684 — 🏦 증권사 소개글 위치: 이름 밑 → 이름 옆(빈 공간) + DB 반영

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제:** **Supabase `brokers` 테이블 20곳 `note`는 Cowork(Opus)가 이미 검증값으로 갱신 완료**(DB=정적 `lib/brokers.ts`와 동일). `/api/brokers`는 `note` 반환하나 `revalidate=86400`(하루) 캐시 → **이 STEP의 push 재배포가 캐시를 플러시**해 새 note가 뜸.
**목표:** 소개글을 **이름 밑(subtitle) → 이름 옆(meta)** 으로. `ListRow`의 `meta` 슬롯은 이름과 바로가기 사이 빈 공간을 채우는 가운데 컬럼(PC만·`sm:block`, 모바일 숨김 → 모바일 그대로).
**대상:** `components/toolbox/BrokerRanking.tsx` (1줄).

---

## 1. `BrokerRanking.tsx` — `subtitle` → `meta`
STEP 683에서 넣은 `subtitle={b.note}`를 **`meta={b.note}`로 변경**:
```tsx
            <ListRow
              href={b.url}
              rank={b.rank}
              iconUrl={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=64`}
              title={b.name}
              meta={b.note}
              stat={b.share != null ? `${b.share}%` : undefined}
            />
```
> `ListRow`는 `meta`가 있으면 이름 컬럼을 `w-52` 고정, `meta`를 `flex-1 text-unjong-muted`(이름 옆 빈 공간)로 렌더. `hidden sm:block`이라 모바일엔 안 뜸(의도). ListRow 수정 불필요.

## 2. 빌드 → 확인
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && (npm run dev &) ; sleep 7 ; echo "http://localhost:3333 증권사 탭 확인"
```
- 증권사 탭(PC): 각 증권사 **이름 옆(바로가기 사이 공간)**에 회색 소개(예: 키움 "리테일 거래 강세·HTS 영웅문", KB "KB금융 계열", SK증권 "독립계 종합증권"). **더 이상 "20년 연속 1위" 아님**(DB 갱신 반영).
- 모바일: 소개 안 뜸(정상).
- console.log 없음. tsc 0.

## 3. CHANGELOG (아래 그대로)
`docs/CHANGELOG.md` 4행 헤더 끝에 `+ 위치 이름옆` 추가(또는 683 문구에 포함). 683 불릿 아래 추가:
```
- **684**: 증권사 소개글 위치 이름 밑→**이름 옆**(`ListRow meta`, 바로가기 사이 빈 공간·PC만). Supabase `brokers.note` 20곳 검증 사실로 갱신(옛 "20년 연속 1위" 등 홍보문구 대체) — Cowork가 DB 직접 갱신, 이 커밋 재배포로 `/api/brokers` 하루캐시 플러시.
```

## 4. 커밋 → 푸시
```bash
git add components/toolbox/BrokerRanking.tsx docs/CHANGELOG.md docs/STEP_684_BROKER_NOTE_BESIDE_COMMAND.md
git commit -m "feat(broker): 소개글 이름 옆(meta)으로 이동 + DB note 검증값 반영(재배포 캐시 플러시)"
git push
```

## Cowork에게 보고
- 증권사 이름 옆 소개글 표시 + 옛 홍보문구 사라졌는지 확인(배포 후 카카오 등 캐시면 잠시 뒤).
