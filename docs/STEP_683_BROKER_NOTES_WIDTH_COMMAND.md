<!-- 2026-07-10 -->
# STEP 683 — 🏦 증권사 소개글(계열·유형 사실) + PC 너비 정리

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제:** 계열 사실 검증은 Cowork(Opus)가 완료(아래 값은 검증됨·홍보 아님·중립 사실). PC 너비(`ToolboxClient.tsx` 증권사 래퍼 `mx-auto max-w-3xl`→`w-full`)는 **Cowork가 이미 편집함**(커밋만 필요).
**목표:** ① `lib/brokers.ts` 20곳 `note`를 **계열/유형 중립 사실**로 채움(옛 홍보문구 아님). ② `BrokerRanking`가 이름 밑 서브텍스트로 표시(`ListRow`의 기존 `subtitle` 사용). ③ 증권사 탭 PC 전체너비.
**대상:** `lib/brokers.ts`, `components/toolbox/BrokerRanking.tsx`, (이미 편집됨) `components/toolbox/ToolboxClient.tsx`.

---

## 1. `lib/brokers.ts` — BROKERS 배열 전체 교체 (13~34행)
```ts
export const BROKERS: Broker[] = [
  { rank: 1, name: "키움증권", domain: "kiwoom.com", url: "https://www.kiwoom.com", share: 18, note: "리테일 거래 강세·HTS 영웅문" },
  { rank: 2, name: "미래에셋증권", domain: "securities.miraeasset.com", url: "https://securities.miraeasset.com", share: 13, note: "미래에셋그룹·대형 종합증권" },
  { rank: 3, name: "한국투자증권", domain: "truefriend.com", url: "https://www.truefriend.com", share: 11, note: "한국금융지주 계열" },
  { rank: 4, name: "삼성증권", domain: "samsungpop.com", url: "https://www.samsungpop.com", note: "삼성 계열 대형사" },
  { rank: 5, name: "NH투자증권", domain: "nhqv.com", url: "https://www.nhqv.com", note: "NH농협금융 계열" },
  { rank: 6, name: "KB증권", domain: "kbsec.com", url: "https://www.kbsec.com", note: "KB금융 계열" },
  { rank: 7, name: "신한투자증권", domain: "shinhansec.com", url: "https://www.shinhansec.com", note: "신한금융 계열" },
  { rank: 8, name: "하나증권", domain: "hanaw.com", url: "https://www.hanaw.com", note: "하나금융 계열" },
  { rank: 9, name: "메리츠증권", domain: "imeritz.com", url: "https://www.imeritz.com", note: "메리츠금융 계열" },
  { rank: 10, name: "토스증권", domain: "tossinvest.com", url: "https://www.tossinvest.com", note: "토스(비바리퍼블리카)·간편 MTS" },
  { rank: 11, name: "대신증권", domain: "daishin.com", url: "https://www.daishin.com", note: "대신금융그룹(독립계)" },
  { rank: 12, name: "한화투자증권", domain: "hanwhawm.com", url: "https://www.hanwhawm.com", note: "한화 계열" },
  { rank: 13, name: "카카오페이증권", domain: "kakaopaysec.com", url: "https://www.kakaopaysec.com", note: "카카오 계열·간편 증권" },
  { rank: 14, name: "유안타증권", domain: "myasset.com", url: "https://www.myasset.com", note: "대만 유안타금융 계열(옛 동양)" },
  { rank: 15, name: "현대차증권", domain: "hmsec.com", url: "https://www.hmsec.com", note: "현대차그룹 계열" },
  { rank: 16, name: "교보증권", domain: "iprovest.com", url: "https://www.iprovest.com", note: "교보생명 계열" },
  { rank: 17, name: "SK증권", domain: "sks.co.kr", url: "https://www.sks.co.kr", note: "독립계 종합증권" },
  { rank: 18, name: "유진투자증권", domain: "eugenefn.com", url: "https://www.eugenefn.com", note: "유진그룹 계열" },
  { rank: 19, name: "IBK투자증권", domain: "ibks.com", url: "https://www.ibks.com", note: "IBK기업은행 계열" },
  { rank: 20, name: "DB증권", domain: "dbsec.co.kr", url: "https://www.dbsec.co.kr", note: "DB금융그룹 계열(옛 동부)" },
];
```
> ⚠️ SK증권은 2018년 SK그룹서 계열분리 → "SK 계열" 아님. "독립계 종합증권"으로 둘 것(사실).

## 2. `components/toolbox/BrokerRanking.tsx` — 이름 밑에 note 표시
현 `<ListRow ... title={b.name} stat=... />`에 **`subtitle={b.note}` 추가**:
```tsx
            <ListRow
              href={b.url}
              rank={b.rank}
              iconUrl={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=64`}
              title={b.name}
              subtitle={b.note}
              stat={b.share != null ? `${b.share}%` : undefined}
            />
```
> `ListRow`는 이미 `subtitle`을 이름 밑 회색 `text-xs`로 렌더(추가 수정 불필요).

## 3. `ToolboxClient.tsx` — (이미 Cowork가 편집함, 확인만)
증권사 래퍼가 `<div className="w-full">`인지 확인(가운데 `mx-auto max-w-3xl` 아님). 아니면 그렇게.

## 4. 빌드 → 커밋
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && (npm run dev &) ; sleep 7 ; echo "http://localhost:3333 증권사 탭 확인"
```
- 증권사 탭: PC 전체너비(가운데 좁은 박스 아님) + 각 증권사 이름 밑 회색 소개(계열/유형).
- console.log 없음. tsc 0.

## 5. CHANGELOG 갱신 (아래 그대로)
`docs/CHANGELOG.md` 4행 헤더의 `673~682`를 **`673~683`**로, 끝에 `+ 증권사 소개글·너비` 추가. 그리고 682 불릿 아래에 추가:
```
- **683**: 🏦 증권사 탭 — 20곳 **소개글(계열/유형 중립 사실)** 이름 밑 표시(`ListRow subtitle`), 옛 홍보 note 대체(STEP 328서 뺀 자리 사실로 복원). PC 증권사 탭 너비 `mx-auto max-w-3xl`→`w-full`(다른 탭과 정렬). SK증권=독립계(2018 SK 분리) 반영.
```

## 6. 커밋 → 푸시
```bash
git add lib/brokers.ts components/toolbox/BrokerRanking.tsx components/toolbox/ToolboxClient.tsx docs/CHANGELOG.md docs/STEP_683_BROKER_NOTES_WIDTH_COMMAND.md
git commit -m "feat(broker): 증권사 소개글(계열/유형 중립 사실) 이름 밑 표시 + PC 탭 전체너비"
git push
```

## Cowork에게 보고
- 증권사 탭 너비 + 이름 밑 소개글(20곳) 확인.
