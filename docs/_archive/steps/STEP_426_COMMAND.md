<!-- 2026-06-27 -->
# STEP 426 — [Phase 2 테스트] 증권사 광고 슬롯 미리보기 (BrokerRanking 상단 '광고' 핀)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_426_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
Phase 2(광고) 첫 **형태 확인용 테스트**. 증권사 바로가기(`BrokerRanking`) **맨 위에 '광고' 슬롯 1개**를 끼워, 광고 자리가 실제로 어떻게 보이는지 localhost에서 확인한다. (실제 광고주·결제 아님 — 시각 형태만.)
- 원칙: 광고는 **사실 랭킹(거래대금순)과 분리된 별도 핀 + '광고' 라벨 + 하이라이트.** 랭킹 순서 안 건드림.
- 재사용 위해 `ListRow`에 `sponsored` 옵션 추가(나중 리딩방·링크 스폰서도 같은 prop 사용 가능).

## 전제
- 최신 main(STEP 425 이후 배포본). **컴포넌트 2개만** → HMR 즉시 반영.
- **커밋 안 함(보류).** 형태 보고 다듬은 뒤 확정되면 그때 커밋. dev 서버 끄지 말 것.
- BrokerRanking은 종목·상품 탭(데스크탑 우측 사이드 / 모바일 종목 클릭 시트)에 나옴 → 거기서 확인.

---

## (1) `components/toolbox/ListRow.tsx` — `sponsored` 옵션 추가 (기존 행 영향 0)

### A. 타입에 prop 추가
**찾기:**
```tsx
  stat?: string;
  trailing?: ReactNode;
};
```
**바꾸기:**
```tsx
  stat?: string;
  trailing?: ReactNode;
  sponsored?: boolean; // 광고(스폰서) 행 — '광고' 라벨 + 하이라이트, 사실 랭킹과 분리
};
```

### B. 구조분해 + 하이라이트 클래스
**찾기:**
```tsx
export default function ListRow({
  href, onClick, rank, iconUrl, iconRound, title, subtitle, meta, stat, trailing,
}: ListRowProps) {
  const hasMeta = meta !== undefined;
  const cls =
    'group flex cursor-pointer items-center gap-3 border-b border-unjong-border px-2 py-2.5 transition-colors last:border-b-0 hover:bg-unjong-background';
```
**바꾸기:**
```tsx
export default function ListRow({
  href, onClick, rank, iconUrl, iconRound, title, subtitle, meta, stat, trailing, sponsored,
}: ListRowProps) {
  const hasMeta = meta !== undefined;
  const cls =
    `group flex cursor-pointer items-center gap-3 border-b border-unjong-border px-2 py-2.5 transition-colors last:border-b-0 hover:bg-unjong-background${
      sponsored ? ' bg-unjong-accent/[0.06] ring-1 ring-inset ring-unjong-accent/25' : ''
    }`;
```

### C. 맨 앞: 광고면 '광고' 칩, 아니면 기존 순위
**찾기:**
```tsx
      {rank !== undefined && (
        <span className={`w-6 shrink-0 text-center text-sm font-bold ${rank <= 3 ? 'text-unjong-accent' : 'text-unjong-muted'}`}>
          {rank}
        </span>
      )}
```
**바꾸기:**
```tsx
      {sponsored ? (
        <span className="shrink-0 rounded bg-unjong-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-unjong-accent">광고</span>
      ) : rank !== undefined ? (
        <span className={`w-6 shrink-0 text-center text-sm font-bold ${rank <= 3 ? 'text-unjong-accent' : 'text-unjong-muted'}`}>
          {rank}
        </span>
      ) : null}
```

## (2) `components/toolbox/BrokerRanking.tsx` — 맨 위에 테스트 광고 행

**찾기:**
```tsx
      <div>
        {BROKERS.map((b) => (
          <ListRow
            key={b.rank}
            href={b.url}
            rank={b.rank}
            iconUrl={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=64`}
            title={b.name}
            stat={b.share != null ? `${b.share}%` : undefined}
          />
        ))}
      </div>
```
**바꾸기:**
```tsx
      <div>
        {/* 🧪 TEST — 증권사 스폰서(광고) 슬롯 예시. 사실 랭킹과 분리된 별도 핀 + '광고' 라벨. 형태 확인용(실제 광고주 아님). */}
        <ListRow
          href="https://www.tossinvest.com"
          iconUrl="https://www.google.com/s2/favicons?domain=tossinvest.com&sz=64"
          title="토스증권"
          subtitle="광고 자리 미리보기 (예시 · 계좌개설 혜택)"
          sponsored
        />
        {BROKERS.map((b) => (
          <ListRow
            key={b.rank}
            href={b.url}
            rank={b.rank}
            iconUrl={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=64`}
            title={b.name}
            stat={b.share != null ? `${b.share}%` : undefined}
          />
        ))}
      </div>
```

---

## 확인 (localhost, 커밋 X)
- **종목·상품 탭** → 데스크탑 우측 '증권사' 리스트 **맨 위**에 **'광고' 칩 + 민트 하이라이트** 행("토스증권 · 광고 자리 미리보기").
- 모바일: 종목 클릭 → 하단 시트의 증권사 바로가기에도 동일하게 맨 위 광고 행.
- 그 아래 기존 1~20위 거래대금 순위는 **그대로**(순서 안 바뀜).
- 빌드/커밋 없이 HMR로 바로 보임. **확인 후 형태 피드백 주면 다듬고 그때 커밋.**
