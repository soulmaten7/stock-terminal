<!-- 2026-07-10 -->
# STEP 685 — 🧭 증권사→정보 하위 + 🏦 종목 리스트 10개마다 증권사 데모 광고(KR) — 빌드·커밋만

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**상태:** 아래 코드는 **Cowork(Opus)가 이미 직접 편집·`tsc --noEmit`=0 검증 완료.** 이 STEP은 **빌드 + 눈 검증 + 커밋/푸시**만.
**바뀐 것:**
- `components/toolbox/ToolboxClient.tsx` — 상단 탭 **종목·정보·검증(3개)**. 증권사는 **정보 하위 탭**으로 강등(전 국가 참조 디렉토리). 근거: 증권사 탭은 트래픽 낮음 → 참조는 하위로, 수익은 인리스트 광고로.
- `lib/ads.ts` — `boardBrokerAd(locale)` 추가(하우스/데모 증권사 광고). KR=대신증권(#11·낮은순위=프리미엄 자리 유료 여지). 한국은 퍼블리셔 어필리에이트 없음(자본시장법) → 직접 광고 제휴 경로.
- `components/toolbox/BrokerAdRow.tsx` (신규) — `BrokerAdTr`(PC 표 colSpan) / `BrokerAdCard`(모바일). 소재 있을 때만 렌더('광고' 라벨+옅은 배경, 랭킹과 분리).
- `components/toolbox/MarketBoard.tsx` — 종목 리스트 **10개마다** 증권사 광고(PC+모바일). 맨 아래 단일 `AdSlotRow slot="broker"` 제거.
> 5개 비KR 보드(Us·Jp·Cn·Vn·Gb)는 **미착수**(데모가 'ko'만 → 렌더할 소재 없음). 그 언어권 광고/제휴 생기면 동일 패턴으로 켠다("한국 먼저" 방침).

---

## 1. 빌드 확인
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && (npm run dev &) ; sleep 7 ; echo "http://localhost:3333 확인"
```

## 2. 눈으로 확인
- 상단 탭 **종목 · 정보 · 검증** 3개. **정보** 클릭 → 하위탭에 뉴스·공시·…·**증권사**·차트·거래소·… (증권사가 정보 안으로).
- **종목** 탭(KR): 리스트 **10번째마다** 옅은 배경의 **"광고 · 대신증권 · 대신금융그룹(독립계) · 계좌개설↗"** 행. 클릭 시 daishin.com. 랭킹 행과 시각 구분.
- 모바일 종목 리스트도 10개마다 광고 카드. 맨 아래 옛 "광고 문의하기"는 없음.
- 미국 등 다른 국가 종목 보드엔 광고 안 뜸(정상 — 데모 KR만).
- console.log 없음. tsc 0.

## 3. CHANGELOG (아래 그대로 추가)
`docs/CHANGELOG.md` 4행 헤더 `673~684`→**`673~685`**, 끝에 `+ 증권사 정보하위·인리스트 광고(KR)` 추가. 684 불릿 아래:
```
- **685**: 🧭 증권사 탭 **상단→정보 하위**로 강등(상단 종목·정보·검증 3탭). 🏦 종목 리스트 **10개마다 증권사 데모 광고**(KR 대신증권, `BrokerAdRow`·`lib/ads.boardBrokerAd`) — 트래픽 낮은 참조 탭 대신 사용자가 있는 리스트에서 거래처 안내(어필리에이트 없는 한국은 직접 광고 제휴 경로·데모로 인벤토리 시연). "거래처 안내"지 투자권유 아님. 5개 비KR 보드는 그 언어권 광고 확보 시 동일 패턴.
```

## 4. 커밋 → 푸시
```bash
git add components/toolbox/ToolboxClient.tsx lib/ads.ts components/toolbox/BrokerAdRow.tsx components/toolbox/MarketBoard.tsx docs/CHANGELOG.md docs/STEP_685_BROKER_TO_INFO_INLINE_AD_COMMAND.md
git commit -m "feat(nav+ads): 증권사→정보 하위 강등 + 종목 리스트 10개마다 증권사 데모 광고(KR, 하우스)"
git push
```

## Cowork에게 보고
- 상단 3탭 + 증권사 정보하위 + 종목 리스트 10개마다 대신증권 광고(KR) 확인. 다른 국가 보드 광고 없음(정상).
