# STEP 835 — 모집단 정의 확정(C안): KR 유니버스를 시총 기준으로 통일

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus` 🔴 **Opus 권장**(전 렌즈 컷 이동 · 판정 변경 · 화면 문구 정합)

**전제 상태**: STEP 834 커밋 `fd3e5d8` 이후 HEAD · 트리 클린

**착수 전 필독**: `docs/UNIVERSE_DEFINITION_MEASUREMENT_2026-07.md`(834 측정) · `docs/US_UNIVERSE_DIAGNOSIS_2026-07.md`(832) · `docs/LENS_COMPLETION_STANDARD.md` §10 · `docs/LENS_DEV_PLAYBOOK.md` §0 + 로그 #42~#64

---

## 0. 결정과 근거 (장은태 확정 07-30 · 834 측정 기반)

**결정 = C안: KR·US 모두 시총 상위 1,000.** KR을 `거래대금 상위` → `시총 상위`로 전환한다. US는 833으로 이미 시총 정상화 완료(변경 없음).

근거(전부 834 실측·문헌):

1. **문헌**: 표준 유니버스 = 시총(ME)·NYSE breakpoint·CRSP 전종목. **거래대금/회전율을 유니버스 선택 기준으로 쓴 관행은 없다**(통제변수·거래비용 분석용). → 거래대금 정의는 문헌 밖.
2. **왜곡 실측**: 거래대금 정의는 저변동 기준선을 **중앙 +13%(32.8→37.2) · p70 +18%(40.8→48.2)** 밀고 **판정 21.2%가 뒤집힌다**(밸류 8.0 · 모멘텀 6.8 · 퀄리티 4.4 · 자산성장 3.9%).
3. **churn**: 경계권 99종목의 일별 변동계수 = 거래대금 **32.4%** vs 가격 **2.7%**(≈11.9배) → 거래대금 정의는 유니버스가 매일 흔들린다.
4. 🔑 **위 왜곡은 지금 KR이 안고 있다** — B(거래대금)가 KR의 현행 정의다. US는 833으로 정상화됐고 KR만 남았다.
5. **메커니즘 정정(Cowork 가설 절반 오류)**: 왜곡의 원인은 "거래대금↔변동성 상관"이 **아니다**(Spearman A 0.206 · B **0.013**). 실제 원인은 **구성 편중**(고회전 소형·투기주 편입 — WULF·CIFR·CORZ 등). **결론이 맞았다고 근거가 맞은 것은 아니다** → 문서에 그대로 기록.

🔴 **이 STEP의 원칙**:
- **먼저 재고, 그다음 바꾼다.** KR 전환의 영향(컷 이동·판정 뒤집힘)을 **전환 전에 측정**해 기록한 뒤 전환한다.
- **하드코딩 금지**(티커 배열·예외 날짜·상수 임계 금지 — 임계는 데이터 조건으로).
- **US·다른 렌즈 문구 불변.**
- **ADR 문제는 이 STEP에서 다루지 않는다**(§6에 다음 STEP 후보로 기록만). 한 번에 두 변화를 섞지 않는다.

---

## §1 — 🔴 전환 전 KR 영향 측정 (프로덕션 미오염)

834를 **KR로** 다시 한다(같은 프로브 재사용·확장):

- A_KR = `kr_stock_snapshot.market_cap` 상위 1,000 · B_KR = `trade_amount` 상위 1,000(현행)
- **교집합/차집합**(500·1,000·1,500) + 차집합 대표 종목 각 10개(이름·시총·거래대금)
- **렌즈별 p30/p70 (A_KR) vs (B_KR)** + **판정 뒤집힘 %**(전체 · 🔑 **교집합 한정 = 순수 컷 효과**)
- **저변동 분포**(중앙·p30·p70·최대) A_KR vs B_KR — US에서 관측된 +13%/+18%가 KR에서 **얼마인지**. 🔴 US 수치를 KR에 이식해 적지 말 것.
- 🔴 `lens_scores`·`lens_cuts`에 **쓰지 말 것**(측정 단계).

---

## §2 — 🔴 KR 유니버스 전환

`lib/lensPrecompute.ts`:

- `topKrByTradeAmount` → **시총 기준 함수로 전환**(`kr_stock_snapshot.market_cap` 내림차순 상위 N). 이름·주석을 실제 동작과 일치시킬 것.
- 🔴 **`tradeAmountOf`는 계속 채운다** — 유니버스 기준이 아니어도 `lens_state_changes.trade_amount`(오늘 화면 정렬용·STEP 764)와 화면 정렬에 쓰인다. 유니버스 기준 변경과 **정렬용 데이터 공급을 혼동하지 말 것**.
- **우선주 제외 규칙 유지 확인**: `lensPrecompute.ts` 476행 부근 "끝자리≠0 제외"가 시총 정렬에서도 **전환 전과 동일하게** 동작하는지(시총 3위 `005935` 삼성전자우가 유니버스에 **들어오지 않는지** 실측으로 증명).
- **결측 처리**: `market_cap`이 null인 종목은 순위에 참여시키지 않되 **몇 개인지 로그**(조용히 버리지 않기 — 832 교훈).
- 🔑 **커버리지 게이트**: 833이 US에 넣은 커버리지·구성 게이트가 KR 경로에도 **적용되는지 확인**하고, 안 되면 적용한다(`market_cap` 확보율 + 직전 상위 N 유지율). KR은 우리 DB라 취득 실패 양상이 다르므로 임계는 **KR 실측 기준**으로 정하고 근거 기재.

---

## §3 — 🔴 전환일 변화 기록 (833 §3 원칙 적용)

전환하면 KR 유니버스가 대량 교체되고 컷이 움직인다 → `lens_state_changes` KR에 **"종목이 변해서"가 아닌 변화**가 쏟아진다.

- 833에 넣은 **구성 변화율 스킵**이 KR 경로에도 걸리는지 확인하고, 걸리면 그대로 작동시킨다(전환일 KR diff = 0 예상).
- 🔴 **특정 날짜 예외 금지** — 구성 변화율이라는 데이터 조건으로 판정.
- 스킵됐다는 사실을 로그·Sentry(정보)로 남긴다.

---

## §4 — 🟠 화면 문구 정합 ("무엇의 상위인가")

정의가 양쪽 동일해졌으므로, 831 분포 카드·백분위·근거줄이 **무엇 대비 순위인지** 정확히 말하게 한다.

- 현행 문구를 **전수 grep**(`lensCopy.ts` · `messages/{ko,en}.json` · 컴포넌트 · `/about` · 코드 주석)해 **"거래대금 상위"·"시총 상위" 표현이 실제와 맞는지** 확인 → 어긋난 곳만 정정.
- 🔴 **말을 늘리지 말 것**(과밀 금지). 기존 `note`·`scope`·`about` **삭제 금지**. 짧고 정확하게.
- ko/en 동시. 🔴 작업 단위 = **주장**: 전수 grep → 전부 정정 → **재grep 잔존 0**.
- `/about`의 커버리지·방법 서술이 새 정의와 어긋나면 함께 정정.

---

## §5 — 🟠 `lens_distribution` PUBLIC EXECUTE revoke (1줄)

833 §4가 `anon`·`authenticated`만 걷어 **`PUBLIC`이 남았다**(Postgres 기본 grant). 실측상 **노출은 없다** — 이 함수는 `security definer`가 아니라 호출자 권한으로 돌아 anon 실행 시 `permission denied for table lens_cuts`로 막힌다(Cowork MCP 실측). 다만 의도와 코드가 어긋나므로 정리:

```sql
revoke execute on function lens_distribution(text, text) from public;
```

- 마이그레이션 파일로 리포 기록 + 적용 여부 명시. 적용 후 `/api/lens` 분포 카드 정상(값 그대로) 확인.

---

## §6 — 문서 (정의 확정 기록)

- `docs/UNIVERSE_DEFINITION_MEASUREMENT_2026-07.md`에 **"결정(835): C안 · 근거 · KR 실측 영향"** 섹션 추가. 🔴 **Cowork 가설의 메커니즘 오류**(상관 아님·구성 편중)도 명기.
- `docs/STATE.md` 덮어쓰기 · `docs/CHANGELOG.md` 블록 · `docs/SYSTEM_MAP.md`(KR 유니버스 정의·`us_market_cap` 테이블·게이트) 갱신. 🔴 수치는 **실측만**(로그 #59).
- **다음 STEP 후보로 기록(구현 금지)**: 🔴 **US 시총 유니버스의 해외 ADR 편입** — 834 §1에서 A만 종목이 ADR(MUFG·TTE·SMFG·ING·NGG)+BRK-A로 확인됐다. 학계 US 표본은 통상 외국 발행사를 제외(CRSP share code 10/11 관행). "US 시장 분포"에 일본·프랑스·네덜란드·영국 발행사가 들어가는 것이 정확한지 **측정·문헌 확인 후 결정**할 사안으로만 남긴다.

---

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(129 유지 + 신규) · `npm run build`
2. **신규 값 테스트**(스냅샷 금지): KR 유니버스가 시총순인지 · **우선주 미편입** · `market_cap` null 제외 · `tradeAmountOf`가 여전히 채워지는지 · 게이트 실패 시 컷 재유도·프루닝 차단 · 구성 변화율 스킵.
3. **§1 측정표**(전환 전) + **전환 후 실측 대조**(예측과 실제가 다르면 그 사실을 보고).
4. **KR 컷 전/후 표**(5개 렌즈 p30/p70·n) + **판정 뒤집힌 종목 수**(전체·교집합 한정).
5. **실측 SQL 인용**: 삼성전자우(`005935`) 유니버스 부재 · KR 초대형주 존재 · `lens_scores` KR 행수·`lens_cuts` KR `as_of` · **전환일 `lens_state_changes` KR 건수**.
6. **US 불변 증거**: US 경로 코드·`lens_cuts` US 값 diff 0.
7. **크론 소요 시간**(KR 전/후) — 300초 예산 대비.
8. §4 재grep 잔존 0 + ko/en 패리티 · 다른 렌즈 문구 불변 diff.
9. §5 revoke 후 분포 카드 정상.
10. `docs/LENS_DEV_PLAYBOOK.md` 로그 1행(교훈: **"유니버스 정의는 렌즈 판정의 일부다 — 문헌 밖 정의는 측정으로 검증되기 전엔 쓰지 않는다. 그리고 결론이 맞아도 근거가 틀렸으면 근거를 고쳐 기록한다"**).
11. 커밋:
    ```bash
    git add app/ components/ lib/ messages/ supabase/ scripts/ docs/
    git commit -m "STEP 835: unify universe definition to market cap for KR and US - measure KR impact, switch KR universe, align wording"
    git push
    ```

## 완료 보고 → Cowork에게

- §1 전환 전 KR 측정(교집합·컷 A vs B·저변동 왜곡 KR 실측치·뒤집힘 %)
- §2 전환 후 실측(우선주 부재·초대형주 존재·행수·게이트)
- §3 전환일 `lens_state_changes` KR 건수
- §4 정정한 문구 전/후 + 재grep 결과
- KR 컷 전/후 표 · 판정 변경 종목 수
- US 불변 diff · 크론 시간 · §5 revoke
- 커밋 해시

(다음 = 836 후보: US 시총 유니버스의 **해외 ADR 편입** 측정·문헌 확인 → 결정. 그 뒤 베타 발송 재검토.)
