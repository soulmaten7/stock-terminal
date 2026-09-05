<!-- 2026-06-07 -->
# STEP 199 — 투자상품 ③ 종목 상세 "어디서 거래할까" 증권사 바로가기

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_199_COMMAND.md 파일 내용대로 실행해줘`

## 목표
종목 상세(`/stock/{code}`) 좌측 정보 패널 밑에 **증권사 바로가기 카드**(허브·동선 안내).
- ETF·주식은 **어느 증권사에서나 거래** → 모든 주요 증권사 링크 한곳에. 사용자가 자기 증권사로.
- **토스증권 = 종목 코드 딥링크**(`tossinvest.com/stocks/{code}`). 나머지 7개사 = 홈페이지(거기서 코드 검색 — 앱/MTS 위주라 공식 딥링크 비공개).
- **운종 거래 X 원칙 명시**("운종은 정보·동선만, 거래 중개 X").
- 국내 종목/ETF(6자리)만. 미국은 해외거래라 추후.
- 광고/제휴 0 (나중에 사용자 지시 시).

## 전제 상태
- HEAD: STEP 198 적용된 상태
- 변경: `components/stock/BrokerLinks.tsx`(신규) + `components/stock/StockPageClient.tsx`(좌측 패널에 추가)

---

## 작업 1/2 — 신규 `components/stock/BrokerLinks.tsx` (파일 생성)

```tsx
"use client";

type Broker = { name: string; url: (code: string) => string; deep?: boolean };

// 도메인: KB·한투·신한 검색 확인 / 토스·키움·미래에셋·삼성·NH 공식 도메인
const BROKERS: Broker[] = [
  { name: "토스증권", url: (c) => `https://tossinvest.com/stocks/${c}`, deep: true },
  { name: "키움증권", url: () => "https://www.kiwoom.com" },
  { name: "미래에셋증권", url: () => "https://securities.miraeasset.com" },
  { name: "삼성증권", url: () => "https://www.samsungpop.com" },
  { name: "NH투자증권", url: () => "https://www.nhqv.com" },
  { name: "KB증권", url: () => "https://www.kbsec.com" },
  { name: "한국투자증권", url: () => "https://securities.koreainvestment.com" },
  { name: "신한투자증권", url: () => "https://www.shinhansec.com" },
];

export default function BrokerLinks({ code }: { code: string }) {
  if (!/^\d{6}$/.test(code)) return null; // 국내 종목/ETF만

  return (
    <section className="mt-3 rounded-2xl border border-unjong-border bg-unjong-surface p-4 shadow-soft">
      <h3 className="text-sm font-bold text-unjong-primary">어디서 거래할까</h3>
      <p className="mt-0.5 text-[11px] leading-relaxed text-unjong-muted">
        ETF·주식은 어느 증권사에서나 거래돼요. 토스는 종목 바로가기, 나머지는 해당 증권사에서 코드{" "}
        <b className="text-unjong-primary">{code}</b> 검색.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {BROKERS.map((b) => (
          <a
            key={b.name}
            href={b.url(code)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg border border-unjong-border px-3 py-2 text-xs font-medium text-unjong-primary transition-colors hover:border-unjong-accent hover:bg-unjong-background"
          >
            {b.name}
            <span className="text-unjong-muted">{b.deep ? "바로가기 →" : "→"}</span>
          </a>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-unjong-muted">운종은 정보·동선만 안내해요(거래 중개 X).</p>
    </section>
  );
}
```

## 작업 2/2 — `components/stock/StockPageClient.tsx` (좌측 패널에 추가)

**찾기:**
```tsx
import StockInfoPanel from "./StockInfoPanel";
```
**바꾸기:**
```tsx
import StockInfoPanel from "./StockInfoPanel";
import BrokerLinks from "./BrokerLinks";
```

**찾기:**
```tsx
      <aside className="sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
        <StockInfoPanel symbol={code} />
      </aside>
```
**바꾸기:**
```tsx
      <aside className="sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
        <StockInfoPanel symbol={code} />
        <BrokerLinks code={code} />
      </aside>
```

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add components/stock/BrokerLinks.tsx components/stock/StockPageClient.tsx && git commit -m "feat(v7): 종목 상세 '어디서 거래할까' 증권사 바로가기(토스 딥링크+8개사)·거래 X 동선안내 (STEP 199)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 국내 종목/ETF 상세 좌측에 **"어디서 거래할까"** 카드(증권사 8개 2열)
- [ ] **토스증권** 클릭 → 새 탭으로 `tossinvest.com/stocks/{code}` (그 종목 페이지) 열림
- [ ] 나머지 증권사 클릭 → 각 홈페이지 새 탭(거기서 코드 검색)
- [ ] "운종은 정보·동선만(거래 중개 X)" 문구 노출
- [ ] 미국 종목(영문 티커) 상세엔 카드 안 뜸(국내만)
- ⚠️ 화면 그대로면 `.next` stale → 진짜 터미널 재시작

## 주의·예상 이슈
- 혹시 안 열리는 증권사 홈페이지 있으면(도메인 변경) 알려주세요 → 그 한 줄만 수정.
- 토스 외 딥링크는 공식 미공개라 홈페이지로(정직). 웹 딥링크 패턴 확인되는 곳 생기면 점진 추가.
- 광고/제휴 링크 아님(순수 중립 동선). 제휴는 추후 사용자 지시 시.
- **문서 TODO**(다음 갱신): STEP 195~199 + 투자상품/리딩방 로드맵 + "광고는 사용자 지시 시에만".
- 다음: 투자상품 마무리 → **리딩방 랭킹(FSS 검증 데이터)** 묶음.

---
> STEP 199 = 투자상품 ③ 증권사 바로가기. 전제 STEP 198. 다음: 리딩방 랭킹. 문서 묶어 갱신.
