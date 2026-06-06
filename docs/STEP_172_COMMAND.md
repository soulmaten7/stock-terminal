<!-- 2026-06-06 -->
# STEP 172 — #3 랭킹 종목 로고 (레터 아바타 원형)

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_172_COMMAND.md 파일 내용대로 실행해줘`

## 목표
실시간 차트(랭킹) 테이블 **종목명 앞에 원형 레터 아바타**(첫 글자+파스텔색). 토스의 종목 로고 자리. `lib/avatar.ts`(STEP 169 생성) 재사용. `MarketClient` 한 곳 수정 → **홈 embedded + /market 둘 다** 적용.

## 전제 상태
- HEAD: `a997964`(STEP 171) 이상
- 변경: `components/market/MarketClient.tsx` (import 1줄 + 종목명 셀 1곳)

---

## 작업 1/2 — `components/market/MarketClient.tsx` (avatar import 추가)

**찾기:**
```tsx
import { LoadingState, EmptyState } from "@/components/ui/State";
```
**바꾸기:**
```tsx
import { LoadingState, EmptyState } from "@/components/ui/State";
import { avatarBg, avatarChar } from "@/lib/avatar";
```

---

## 작업 2/2 — `components/market/MarketClient.tsx` (종목명 셀에 아바타)

**찾기:**
```tsx
                        <td className="px-4 py-3 font-medium text-unjong-primary">{r.name}</td>
```
**바꾸기:**
```tsx
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-unjong-primary"
                              style={{ background: avatarBg(r.name) }}
                            >
                              {avatarChar(r.name)}
                            </span>
                            <span className="font-medium text-unjong-primary">{r.name}</span>
                          </div>
                        </td>
```

> 종목명 텍스트 앞에 원형 레터 아바타. 정렬·클릭(행 전체 클릭→종목) 그대로.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/market/MarketClient.tsx && git commit -m "feat(v7): 랭킹 테이블 종목 로고 — 레터 아바타 원형(홈·마켓 공통) (STEP 172)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 홈 실시간 차트 + /market 랭킹 종목명 앞에 **원형 레터 아바타**(SK·삼·K 등) 보이는지
- [ ] 행 클릭→종목 이동, 정렬 그대로인지
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 레터 아바타는 종목명 첫 글자(KODEX 레버리지=K, SK하이닉스=S). 관심 레일과 동일 스타일(`lib/avatar.ts`).
- 유명 종목 실로고는 추후 옵션(현재 무료 국내 로고 소스 없음).
- 다음: #2 hover 상세(차트·요약) · #4 카테고리 탭(데이터 작업).

---
> STEP 172 = #3 랭킹 로고. 전제 `a997964`. 다음: #2 hover 상세 · #4 카테고리 탭. 문서 묶어 갱신.
