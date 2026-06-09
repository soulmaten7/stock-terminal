<!-- 2026-06-07 -->
# STEP 223 — 증권사 20개로 확장 + 거래대금 순위 헤더 정리

## 실행 명령어 (Sonnet — 기본)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
> 그 다음: `@docs/STEP_223_COMMAND.md 파일 내용대로 실행해줘`

## 목표 (사용자 지시)
1. 증권사 거래대금 순위 부제 **"국내주식 거래대금 점유율 순 · 운종은 거래 안내만(허브)" 삭제**.
2. 제목 **"증권사 거래대금 순위"가 한 줄**에 들어가게(현재 2줄로 깨짐) → 캐비엇("최근 분기 기준 · 근사치")을 **제목 아래로**.
3. 증권사를 12개 → **20개**로 확장(리테일 주요사 전부, 도메인 검증 완료).

## 전제 상태
- HEAD: STEP 222 상태
- 변경 2파일: `lib/brokers.ts`(8개 추가) · `components/toolbox/BrokerRanking.tsx`(헤더 정리)
- DB 변경 0

---

## 작업 1/2 — `lib/brokers.ts` 증권사 8개 추가 (13~20)

**찾기:**
```ts
  { rank: 12, name: "한화투자증권", domain: "hanwhawm.com", url: "https://www.hanwhawm.com" },
];
```
**바꾸기:**
```ts
  { rank: 12, name: "한화투자증권", domain: "hanwhawm.com", url: "https://www.hanwhawm.com" },
  { rank: 13, name: "카카오페이증권", domain: "kakaopaysec.com", url: "https://www.kakaopaysec.com", note: "간편 MTS" },
  { rank: 14, name: "유안타증권", domain: "myasset.com", url: "https://www.myasset.com" },
  { rank: 15, name: "현대차증권", domain: "hmsec.com", url: "https://www.hmsec.com" },
  { rank: 16, name: "교보증권", domain: "iprovest.com", url: "https://www.iprovest.com" },
  { rank: 17, name: "SK증권", domain: "sks.co.kr", url: "https://www.sks.co.kr" },
  { rank: 18, name: "유진투자증권", domain: "eugenefn.com", url: "https://www.eugenefn.com" },
  { rank: 19, name: "IBK투자증권", domain: "ibks.com", url: "https://www.ibks.com" },
  { rank: 20, name: "DB증권", domain: "dbsec.co.kr", url: "https://www.dbsec.co.kr" },
];
```

> 13~20위 순서는 근사치(거래대금 데이터 미공개 구간) — 헤더 "근사치(분기 변동)" 캐비엇이 커버. 바꾸려면 이 배열만 손보면 됨.

---

## 작업 2/2 — `components/toolbox/BrokerRanking.tsx` 헤더 정리

**찾기:**
```tsx
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-unjong-primary">증권사 거래대금 순위</h2>
        <span className="shrink-0 text-xs text-unjong-muted">최근 분기 기준 · 근사치(분기 변동)</span>
      </div>
      <p className="mb-4 text-xs text-unjong-muted">국내주식 거래대금 점유율 순 · 운종은 거래 안내만(허브)</p>
```
**바꾸기:**
```tsx
      <div className="mb-3">
        <h2 className="text-lg font-bold text-unjong-primary">증권사 거래대금 순위</h2>
        <p className="mt-0.5 text-xs text-unjong-muted">최근 분기 기준 · 근사치(분기 변동)</p>
      </div>
```

> 제목이 한 줄 전체 폭을 쓰므로 안 깨짐. 캐비엇은 제목 아래 작게. "국내주식…허브" 부제는 제거.

---

## 빌드 검증 + 커밋·푸시
```bash
cd ~/stock-terminal && npm run build
```
빌드 ✓ 후:
```bash
cd ~/stock-terminal && git add lib/brokers.ts components/toolbox/BrokerRanking.tsx && git commit -m "feat(v7): 증권사 거래대금 순위 20개로 확장 + 헤더 정리(제목 한 줄·부제 제거) (STEP 223)" && git push
```

## 완료 보고 (Cowork 에게 전달할 것)
- [ ] `npm run build` exit 0 / 커밋·push
- [ ] 증권사 순위 **제목 "증권사 거래대금 순위"가 한 줄**, 그 아래 작게 "최근 분기 기준 · 근사치(분기 변동)"
- [ ] **"국내주식… 허브" 부제 사라짐**
- [ ] 순위가 **20개**(키움~DB증권)로 늘고, 로고·바로가기 정상
- ⚠️ 서버 컴포넌트 아님(클라이언트) → 하드 새로고침이면 바로 반영. 그래도 그대로면 `.next` stale 재시작.

## 주의·예상 이슈
- 추가 8개 도메인 전부 검색 검증 완료(kakaopaysec.com·myasset.com·hmsec.com·iprovest.com·sks.co.kr·eugenefn.com·ibks.com·dbsec.co.kr).
- 13~20위 **순서는 근사치** — 정확 거래대금 데이터가 공개 안 되는 구간이라 일반 규모순. 바꾸려면 `lib/brokers.ts` 배열 수정.
- 20개라 레일 세로로 길어짐(정상, 비고정).
- **문서 TODO**(다음 갱신): STEP 162·215~223.

---
> STEP 223 = 증권사 20개 확장 + 헤더 정리. 전제 STEP 222. 문서 묶어 갱신.
