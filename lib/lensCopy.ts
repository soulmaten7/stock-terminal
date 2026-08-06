// 렌즈 겉면 카피 — 언어별 맵(원본 = docs/LENS_COPY.md). 이름=영문 앵커(코드 별도)·설명만 언어별.
// 원칙: 각 언어답게(직역 아님)·짧고 구체·번역 안전. 자동번역 X. 기본 ko, ?lang=en 지원. 다음: ja·zh 열 추가.
// what=겉면 한 줄(뭔지) · about=알아보기(개념·유래·왜 쓰나) · note=자세히(백테스트 근거·한계).
// ⚠️ note의 ko·en은 수치·레퍼런스가 **서로 일치**해야 한다(패리티). 단 STEP 813~817 정책: **자체 백테스트 점추정(t·샤프·βHML)이 재실행서 재현 안 되면 ko·en 양쪽에서 삭제**하고 재현 가능한 정성 결론·원문 헤드라인으로 교체한다(근거 없는 수치 화면 금지·CLAUDE.md). 남은 수치는 원문 수치이거나 재현 확인된 것만. 되돌아온 삭제 수치는 `lib/lensDenominator.test.ts` 음성 어서션이 잡는다.

export type Locale = "ko" | "en";
// question = 카드 제목용 초보자 질문형(STEP 787) — name·nameEn(학술 앵커)은 6곳 소비처(문장·pill·프롬프트)가 있어 rename 대신 이 필드를 신설.
// shortLabel = 종합 카드의 강점/주의 나열용 짧은 쉬운 라벨(STEP 788) — question(질문형·긴 문장)과도, name(학술 앵커)과도 다른 세 번째 용도.
// STEP 810 §1: "이 기법이 검증한 것" 3요소(무료 노출·결정론 정적). verified=검증 범위 / failure=알려진 실패 모드 / when=적용 조건.
type LensScope = { verified: string; failure: string; when: string };
type LensText = { name: string; question: string; shortLabel: string; what: string; about: string; note: string; scope: LensScope };
type FscoreText = { name: string; subtitle: string; question: string; shortLabel: string; what: string; na: string; about: string; scope: LensScope };

export const LENS_COPY: Record<Locale, {
  momentum: LensText; lowvol: LensText; valuation: LensText; quality: LensText; assetgrowth: LensText; technical: LensText; fscore: FscoreText;
}> = {
  ko: {
    momentum: {
      name: "모멘텀",
      question: "최근 오름세가 강한가?",
      shortLabel: "오름세",
      what: "요즘 강하게 오른 종목이 계속 갈지 보는 방법 — 오르는 흐름이 이어지는 장에 잘 맞아요.",
      about: "오른 주식은 한동안 더 오르는 '관성'이 시장에 있다는 아이디어예요. 1993년 제가디시·티트만이 데이터로 처음 밝혔고, 좋은 소식에 사람들이 천천히 반응하는 심리 때문이라 봐요 — 그래서 최근 강한 주식을 따라가는 추세추종에 씁니다.",
      note: "12-1 모멘텀(현상=Jegadeesh-Titman 1993 · 계산 사양=Carhart(1997) UMD/FF 모멘텀 팩터): 오른 주식이 한동안 더 오르는 '추세 지속'은 학계에서 가장 널리 재현된 이상현상이에요. 우리 백테스트도 방향이 +이고, 초·중·후반 세 구간으로 나눠도 부호가 3/3 일관(시기 무관)이며, 팩터 회귀에서 우리 신호가 학계 모멘텀 팩터에 흡수돼요(βMom 큼 = '우리 모멘텀 = 학계 모멘텀'). 시장·규모·가치(FF3)를 넘는 알파도 +(대체로 유의). 단 세기(t·샤프)는 표본 구간에 따라 흔들려 특정 값으로 못박지 않고, 수익 '수준'은 생존편향·동일가중으로 부풀려져 실전 기대치가 아니에요(방향이 맞다는 뜻이지 수익 보장 아님). ⚠️ 12~18개월 뒤 부분 반전·급반등장 '모멘텀 크래시'가 알려진 실패 모드예요. 판정은 시장 분포 순위(상하위 30%)라 절대 방향이 아니에요(생존자 상위 1,000 사이 순위).",
      scope: {
        verified: "현상은 제가디시·티트만(1993)이 미국 주식(1965~89·NYSE·AMEX·10분위 롱숏)에서 처음 확인했어요. 다만 우리 계산 사양(12개월 형성·최근 1개월 제외·상하위 30% 3분위)은 그 논문의 기본형이 아니라 카하트(1997) UMD·파마-프렌치 모멘텀 팩터의 관행이에요. 둘 다 '집단 간 평균 차이'지 개별 종목의 미래가 아니에요.",
        failure: "12~18개월 뒤엔 오히려 뒤집히는 경향(부분 반전)이 있고, 급락 뒤 급반등장에선 크게 무너지는 '모멘텀 크래시'가 알려져 있어요. 또 우리 순위는 '오늘 기준 상위 1,000종목'(KR·US 모두 시총 상위)끼리라 상장폐지·쪼그라든 종목이 빠진 생존자들 사이의 순위예요(논문은 상장폐지분까지 포함). '이 종목이 오른다'는 뜻이 아니에요.",
        when: "최근 1개월은 빼고(단기 반전 회피) 봐요. 논문은 3~6개월 보유 전제인데 우리는 시점 스냅샷이라 보유기간 개념이 없어요 — 시장 내 상대 순위로만 보세요.",
      },
    },
    lowvol: {
      name: "저변동성",
      question: "가격이 많이 출렁이나?",
      shortLabel: "가격 출렁임",
      what: "덜 출렁이는 안정적인 종목인지 보는 방법 — 하락장에서 방어적으로 유용해요.",
      about: "덜 흔들리는 안정적 주식이 크게 요동치는 주식보다 위험 대비 성과가 낫다는 발견이에요(저변동성 이례현상). '대박'을 노려 변동 큰 주식에 사람이 몰려 비싸지고, 지루한 우량주는 저평가되기 때문이라 설명해요 — 방어·위험 관리에 씁니다.",
      note: "저변동성(현상=Baker-Bradley-Wurgler 2011 · 우리 측정=1년 일별 실현변동성): 저변동군은 고변동군보다 실현 위험이 훨씬 낮고(방어) 시장베타가 음(−)이라 하락장에 강한 성격이에요. 회전율도 낮아 거래비용에 강건 → 위험관리·방어 렌즈로 유효. 단 '저변동이 수익도 더 높다'는 수익 우위는 우리 표본에서 통계적으로 약하고 불안정해요(표본 구간에 따라 유의성이 흔들리고 부호도 뒤집힘) — 위험 대비 방어가 핵심이지 수익 보장이 아니에요. · 3중 교차검증(STEP559): 단순 저−고 수익 롱숏은 구간마다 부호가 뒤집혀 '저변동이 수익도 더 높다'는 아님 재확인. 이 렌즈 근거는 raw 수익이 아니라 위험대비 방어예요. ⚠️ 우리 측정은 BBW 원문(5년 월별 총변동성·5분위)과 달리 1년 일별 변동성·3분위이고, 유니버스도 '오늘 상위 1,000'(KR·US 모두 시총)이라 생존편향이 있어요.",
      scope: {
        verified: "현상은 베이커·브래들리·워글러(2011)가 미국(1968~2008)에서 저변동 '집단'이 위험 대비 성과가 나았음을 보였어요(위험 낮을수록 수익도 낮다는 CAPM을 반증). 다만 우리 측정은 그 논문의 5년 월별 총변동성·5분위가 아니라 1년 일별 실현변동성(일간수익률 표준편차×√252)·상하위 30% 3분위예요 — 총변동성 계열은 같지만 창·빈도·분위가 달라요.",
        failure: "수익을 더 준다는 신호가 아니에요 — 위험(변동)이 낮다는 것뿐이고, 우리 자체 백테스트에선 수익 우위가 약하고 불안정했어요(표본 구간에 따라 통계적 유의성·부호가 흔들림). 상승장에선 뒤처질 수 있어요. 또 우리 순위는 '오늘 상위 1,000종목'(KR·US 모두 시총)끼리라 상장폐지·쪼그라든 종목이 빠진 생존자 사이 순위예요.",
        when: "방어·위험 관리 관점에서, 시장 내 상대적으로 덜 흔들리는 편인지로 보세요.",
      },
    },
    valuation: {
      name: "밸류(가치)",
      question: "버는 것에 비해 싼가?",
      shortLabel: "가격 대비 가치",
      what: "버는 돈·가진 자산에 비해 주가가 싼지 보는 방법 — 길게 보는 투자에 잘 맞아요.",
      about: "기업의 이익·순자산에 비해 주가가 싼 '가치주'를 사는 접근이에요. 벤저민 그레이엄이 철학(안전마진)으로 씨를 뿌렸고, 데이터로 입증한 건 따로예요 — 이익 대비 싼 효과는 바수(1977), 순자산 대비 싼 효과는 로젠버그 외(1985)가 밝혔고 파마·프렌치가 이를 'HML' 가치 프리미엄으로 정식화했어요. 시장이 인기 없는 주식을 과하게 싸게 판다는 생각이 바탕이에요.",
      note: "밸류(가치): 이익 대비 싼 효과는 바수(1977·E/P), 순자산 대비 싼 효과는 로젠버그 외(1985)·파마-프렌치 HML(B/M)로 정식화된 학계 정설이에요. 우리 백테스트(연1회 형성·월별 롱숏·저비용)도 방향이 +이고, 우리 밸류 신호가 학계 HML 팩터에 실제로 대응해요(βHML 양(+)·큼 = '우리 밸류=학계 가치팩터'). 단 프리미엄의 세기·통계적 유의성은 표본 구간에 따라 흔들려(순자산 B/M이 이익 E/P보다 일관되게 강함) 특정 t값으로 못박지 않아요. ⚠️ 최근 ~15년 가치주 부진(성장주 우위)은 학계도 약화를 논쟁 중이라(파마-프렌치 2021: 후반기 프리미엄 하락, 단 변동성이 커 '소멸'이라 단정은 못 함) '지금 시기 유효'라 단정 불가. 화면 판정은 PER(E/P) 기준이고(KR=직전 연간=바수 방식 / US=최근 4분기 TTM), 적자(순이익≤0)는 바수·FF처럼 산출에서 제외해요. 유니버스가 '오늘 상위'(KR·US 모두 시총)라 생존편향이 있고, PER·PBR은 단일종목 절대값이라 같은 업종 안에서 상대비교로 봐야 오독이 없어요. 예측·보장 아님.",
      scope: {
        verified: "바수(1977·이익 대비 E/P)와 로젠버그 외(1985)·파마-프렌치(순자산 대비 B/M=HML)가 데이터로 확인한 '가치 프리미엄'이에요 — 싼 '집단'이 장기 평균에서 비싼 집단을 이겼어요(그레이엄은 철학적 뿌리). 개별 싼 종목이 오른다는 말이 아니에요.",
        failure: "싼 데는 이유가 있는 '가치 함정'이 흔해요(구조적으로 쇠퇴하는 회사는 싼 채로 더 빠질 수 있어요). 최근 ~15년은 성장주가 앞서 가치주가 부진했고, 학계도 프리미엄 약화를 논쟁 중이에요(파마-프렌치 2021).",
        when: "길게 보는 관점에서, 같은 업종 안에서 상대적으로 싼지로 보세요(섹터·성장성 무시하면 오독). 화면 판정은 이익 대비(PER·E/P)지만 우리 백테스트에선 순자산 대비(PBR·B/M)가 더 강했으니 PBR도 함께 보세요.",
      },
    },
    quality: {
      name: "퀄리티",
      question: "돈을 잘 버는 회사인가?",
      shortLabel: "돈 버는 힘",
      what: "회사가 자산 대비 돈을 잘 버는 '알짜'인지 보는 방법 — 튼튼한 우량주를 고를 때 잘 맞아요.",
      about: "매출총이익을 자산으로 나눈 '총수익성'으로 회사의 질을 보는 방법이에요. 노비-마르크스가 2013년 '싼 것(가치)만큼 질 좋은 것도 중요하다'며 데이터로 밝혔어요 — 자산을 잘 굴려 꾸준히 돈 버는 회사가 장기적으로 낫다는 생각이 바탕이에요.",
      note: "퀄리티(총수익성/Gross Profitability — Novy-Marx 2013): 매출총이익(매출−매출원가) ÷ 같은 해 총자산. 원문에서 고−저 집단 롱숏이 시장·규모·가치(FF3)를 넘는 유의한 알파(월 ~0.5%·t≈4.5)를 냈고, 밸류(B/M)와 음의 상관이라 '가치의 다른 얼굴'(밸류와 독립·상호보완)로 검증됐어요. 우리 백테스트도 방향 +·밸류와 독립(βHML 음)이나 세기는 표본 구간에 따라 흔들려 특정 t값으로 못박지 않아요(수익 '수준'은 생존편향·동일가중으로 과대·유니버스=오늘 상위 1,000·KR·US 시총). ⚠️ 후속 연구(Ball 외 2015 'Deflating Profitability')는 이 효과가 분모(총자산)로 나눈 데서 상당 부분 나온다(밸류 성분이 섞임)며 영업이익 기준을 제안했고 파마-프렌치도 5팩터에서 영업수익성으로 갔어요 — 분모 민감성이 한계예요. 원문은 단독보다 '수익성 좋은 가치주 매수'처럼 밸류와 결합할 때 가장 강했어요. 은행·보험 등 매출총이익 항목이 없는 금융사는 산출 제외(원문도 금융 제외)되나, 명시적 업종필터가 아니라 매출총이익 보고 여부에 따른 것이라 리츠 등 일부는 값이 나올 수 있어요. '퀄리티'는 넓은 말이라 여기선 총수익성 한 지표로 좁혀 쓴 거예요(QMJ의 수익성·성장·안전 중 수익성 축). 예측·보장 아님.",
      scope: {
        verified: "노비-마르크스(2013)가 총수익성(매출총이익/총자산)이 가치(B/M)만큼 예측력이 있음을 보였어요 — '가치의 다른 얼굴'(밸류와 독립·FF3 알파 유의). 집단 비교로 확인됐어요.",
        failure: "단독 종목 선정이 아니라 밸류와 결합할 때 강했어요(수익성 좋은 가치주). 분모(총자산)로 나눈 데서 효과가 상당 부분 나온다는 후속 비판(Ball 외 2015)이 있고, 은행·보험 등 매출총이익 없는 금융사는 계산이 안 돼요(리츠 등 일부는 값이 나올 수 있음).",
        when: "밸류와 함께, 시장 내 상대적으로 자산 대비 잘 버는 편인지로 보세요.",
      },
    },
    assetgrowth: {
      name: "자산성장",
      question: "몸집을 무리하게 불리지 않았나?",
      shortLabel: "몸집 관리",
      what: "회사가 자산(몸집)을 얼마나 빠르게 불리는지 보는 방법 — 너무 공격적으로 키우면 이후 성과가 약한 편이에요.",
      about: "회사가 설비 투자·인수 등으로 자산을 얼마나 공격적으로 늘리는지 보는 지표예요. 2008년 쿠퍼·굴렌·실이 '자산을 빠르게 불린 회사일수록 이후 수익은 오히려 약하다'를 데이터로 밝혔어요(과잉 투자·무리한 확장 경계). 파마·프렌치 5팩터 중 투자 팩터(CMA)이기도 해요 — 자본을 신중히 쓰는 회사를 선호하는 관점이에요.",
      note: "자산성장(투자 팩터 — Cooper-Gulen-Schill 2008 / 파마-프렌치 5팩터 CMA · 같은 계열): 총자산 전년比 증가율((당기−전기)/전기). 자산을 공격적으로 불린 회사가 이후 수익이 약한 편이라는 이상현상 — 학계 정설이고 대규모 재현연구(Hou-Xue-Zhang 2020: 447개 이상현상 중 3분의 2가 탈락한 와중에도 살아남은 축)에서 견고했어요. 밸류와 독립(βHML 낮음 = '자본 규율'이라는 별개 축). ⚠️ 단 원문의 큰 효과(저−고 연 ~20%)는 소형·초소형주·동일가중에 크게 기대요 — 재현연구도 대형주·시총가중에선 훨씬 작아진다고 봤어요. 우리 유니버스는 오늘 상위 1,000(KR·US 모두 시총)이라 효과가 가장 센 초소형주 구간을 충분히 안 담아, 우리 표본에선 방향만 +이고 통계적으론 약해요(효과가 가짜라서가 아니라 센 구간을 안 담아서). 해석은 논쟁 중(CGS=과잉투자·과잉기대 행동재무 / q이론=합리적 투자결정 — 방향은 합의, 이유는 갈림). 은행·보험은 CGS 원문은 제외했으나 우리는 총자산이 있어 값이 나와요(은행 자산성장=예금·대출 팽창이라 제조업 설비투자와 뜻 달라 해석 주의). 유니버스='오늘 상위'라 생존편향. 예측·보장 아님.",
      scope: {
        verified: "쿠퍼·굴렌·실(2008)이 자산을 급하게 불린 기업들이 이후 평균적으로 저조했음을 보였어요(투자 팩터·FF5 CMA). 대규모 재현연구에서도 살아남은 견고한 축이에요 — 집단 비교예요.",
        failure: "효과의 큰 부분이 소형·초소형주에서 나와요 — 우리 유니버스(오늘 상위 1,000·KR·US 시총)는 그 초소형 구간을 충분히 안 담아 우리 표본에선 통계적으로 약했어요. 방향(과잉투자 경계)은 정설이나 대형주에선 얇아요(원전도 대형주 효과 약함). 은행은 CGS 원문은 제외했으나 우리는 총자산이 있어 값이 나와요 — 은행 자산성장은 예금·대출 팽창이라 뜻이 달라 해석 주의.",
        when: "자본 규율의 참고 축으로, 시장 내 확장이 보수적인 편인지로 보세요.",
      },
    },
    technical: {
      name: "기술",
      question: "지금 흐름이 위인가, 아래인가?",
      shortLabel: "단기 흐름",
      what: "차트로 지금 과열인지·흐름이 위인지 보는 방법 — 현재 상태를 빠르게 훑는 참고용이에요.",
      about: "차트의 가격·패턴으로 '지금 과열인지, 추세가 위인지'를 보는 전통적 기술적 분석이에요. RSI는 1978년 와일더가 만든 과열·침체 지표, 이동평균선은 일정 기간의 평균 가격이에요 — 단기 흐름을 빠르게 훑는 참고 도구예요(단독 신호로는 약함).",
      note: "기술 지표는 7개 렌즈 중 유일하게 학술 검증 팩터가 아니에요(참고용). 판정(위/아래)은 200일선 대비 기준이고, RSI·52주 위치는 함께 보여주되 판정엔 안 써요. · RSI(와일더 1978): 30/70 과열·침체는 와일더 본인의 경험칙이지 통계 검정 결과가 아니에요. 침체 매수(저RSI 롱)는 우리 재검(월별 롱숏)에서 수익 우위가 없었고(무의미) 회전율이 높아 비용만 커요 — 매매신호로 통하지 않아요. · 200일선 추세: 이동평균 추세 규칙은 추세추종·시계열 모멘텀 연구(Moskowitz 외 2012·Faber 2007)와 사촌지간이지만 그 근거는 지수·자산군 수준이고(개별 종목 아님), 고전적 검정(Brock 외 1992)도 데이터 스누핑을 보정하니 유의성이 사라졌어요(Sullivan-Timmermann-White 1999) — 그래서 '검증됐다'고 못 해요. 우리 재검에서도 200일선 추세는 방향은 +지만 사실상 (횡단면) 모멘텀과 겹치는 신호라 독립적이지 않아요. → RSI·52주위치·이동평균은 '지금 상태' 표시일 뿐 매매신호 아님, 추세 판단은 모멘텀 렌즈로. 개별 종목·거래비용·데이터 스누핑을 감안하면 단독 근거로 삼지 마세요.",
      scope: {
        verified: "RSI(와일더 1978)·이동평균은 오래된 실무 관행 지표예요. 다른 렌즈와 달리 학술적으로 검증된 팩터가 아니에요 — RSI 30/70은 와일더의 경험칙(검정 결과 아님)이고, 침체 매수는 우리 재검에서도 통하지 않았어요.",
        failure: "매매 신호가 아니라 '지금 상태' 표시일 뿐이에요. 200일선 추세는 추세추종 연구의 사촌이지만 그건 지수 수준이고, 고전적 검정도 데이터 스누핑 보정 후 유의성이 사라졌어요(STW 1999)·개별 종목엔 노이즈가 크고 사실상 모멘텀과 겹쳐요.",
        when: "참고용으로만 보세요. 추세 판단은 모멘텀 렌즈로.",
      },
    },
    fscore: {
      name: "F-스코어", subtitle: "재무 건전성",
      question: "재무가 튼튼한가?",
      shortLabel: "재무 건전성",
      what: "재무가 튼튼한지 9가지로 점수 매겨요 — 돈 잘 버는지, 빚 감당되는지, 작년보다 나아졌는지.",
      na: "재무 데이터가 부족해 점수를 낼 수 없어요.",
      about: "회계학자 피오트로스키가 2000년 만든, 기업 재무 건강을 9개 항목으로 점수 매기는 체크리스트예요(수익성·부채·효율의 전년 대비 개선). 원래 값싼 가치주 중 '진짜 부실한 곳'을 걸러내려 만들었어요 — 그래서 수익 예측이 아니라 재무 건전성 판단에 씁니다.",
      scope: {
        verified: "피오트로스키(2000)가 '싼 가치주(고B/M) 집단 안에서' 재무가 개선되는 기업을 골라내면 성과가 나았음을 보였어요(고점수 8~9 vs 저점수 0~1). 부실을 걸러내는 도구예요.",
        failure: "원전은 가치주 집단 안의 도구예요(전 종목용 일반 품질 점수가 아니에요) — 효과도 소형·중형의 소외된 가치주에 몰렸고 대형주에선 약했어요. 은행·보험은 유동비율 등 항목이 없어 산출 불가예요. 점수가 높다고 오른다는 뜻은 아니고, 우리 '양호(≥7)'는 자체 기준이에요(피오트로스키의 '높음'은 8~9점).",
        when: "부실 회피 관점에서, 재무가 전년보다 나아졌는지로 보세요.",
      },
    },
  },
  en: {
    momentum: {
      name: "Momentum",
      question: "Is the recent uptrend strong?",
      shortLabel: "Uptrend",
      what: "Whether a stock that's been climbing keeps climbing — best when trends hold.",
      about: "The idea that stocks which have been rising tend to keep rising for a while — a kind of market inertia. Jegadeesh and Titman first showed it in the data in 1993, often explained by investors reacting slowly to good news. It's the basis of trend-following: ride the recent winners.",
      note: "12-1 Momentum (phenomenon = Jegadeesh-Titman 1993 · spec = Carhart 1997 UMD / FF momentum factor): the tendency of winners to keep winning ('trend persistence') is one of the most widely replicated anomalies in the literature. Our backtest also points positive, holds the same sign across all three sub-periods (early/middle/late, 3/3 — period-independent), and in factor regressions our signal is absorbed by the academic momentum factor (high βMom = 'our momentum is the academic momentum factor'). The alpha beyond market/size/value (FF3) is positive too (broadly significant). But the strength (t, Sharpe) drifts with the sample window, so we do not pin a specific value, and the return 'level' is overstated by survivorship and equal weighting (direction, not a return guarantee). ⚠️ Known failure modes: partial reversal after 12-18 months and 'momentum crashes' in sharp rebounds. The verdict is a market-distribution rank (top/bottom 30%), not an absolute direction (a rank among the surviving top 1,000).",
      scope: {
        verified: "The phenomenon was first shown by Jegadeesh and Titman (1993) on US stocks (1965-89, NYSE/AMEX, decile long-short). But our spec (12-month formation, skipping the most recent month, top/bottom 30% terciles) follows the Carhart (1997) UMD / Fama-French momentum-factor convention, not that paper's base form. Both are group averages, not a claim about one stock's future.",
        failure: "It tends to partly reverse 12-18 months later, and it can break down badly in sharp rebounds after a crash (a 'momentum crash'). Also, our ranking is among today's top 1,000 names (US and KR by market cap), so delisted or shrunken stocks are missing — a rank among survivors (the papers include delisted returns). It does not mean this stock will rise.",
        when: "We skip the most recent month (to avoid short-term reversal). The papers assume a 3-6 month holding period; we take a point-in-time snapshot with no holding period — read it only as a relative rank within the market.",
      },
    },
    lowvol: {
      name: "Low Volatility",
      question: "Does the price swing a lot?",
      shortLabel: "Price swings",
      what: "How steady (rather than jumpy) a stock is — handy for playing defense in down markets.",
      about: "The finding that calmer, steadier stocks tend to do better per unit of risk than wild, jumpy ones (the low-volatility anomaly). One story: people chase big-swing names hoping for a jackpot and bid them up, while boring quality names get left cheap. Used for defense and risk management.",
      note: "Low Volatility (phenomenon = Baker-Bradley-Wurgler 2011 · our measure = 1-year daily realized volatility): the low-volatility group carries much less realized risk than the high-volatility group (defensive), with a negative market beta = it holds up in down markets. Low turnover makes it robust to transaction costs → it works as a risk-management and defense lens. But the plain claim that 'low volatility also earns more' is statistically weak and unstable in our sample (significance and even the sign shift across sample windows) → risk-adjusted defense is the point, not a return guarantee. · Triple cross-validation (STEP559): the plain low−high return long-short flips sign across folds = confirmation that 'low volatility earns more' does not hold. This lens rests on risk-adjusted defense, not raw returns. Note: our measure differs from the paper (5-year monthly total volatility, quintiles) — we use 1-year daily volatility, terciles, and a today's-top-1,000 universe (US and KR by market cap; survivorship).",
      scope: {
        verified: "The phenomenon was shown by Baker-Bradley-Wurgler (2011) on US stocks (1968-2008): the low-volatility group did better on a risk-adjusted basis (a rebuttal to CAPM, which says lower risk means lower return). But our measure is not the paper's 5-year monthly total volatility with quintiles — it is 1-year daily realized volatility (daily-return standard deviation × √252), top/bottom 30% terciles. Same total-volatility family, but a different window, frequency and cut.",
        failure: "It is not a signal for higher returns — only for lower risk (volatility). In our own backtest the return edge was weak and unstable (significance and even the sign shift across sample windows). It can lag in rising markets. Also, our ranking is among today's top 1,000 names (US and KR by market cap) — a rank among survivors (delisted or shrunken stocks are missing).",
        when: "Read it for defense and risk management — whether it swings relatively less than the market.",
      },
    },
    valuation: {
      name: "Value",
      question: "Is it cheap for what it earns?",
      shortLabel: "Value",
      what: "Whether the price looks cheap next to a company's earnings and assets — suited to the long game.",
      about: "Buying stocks priced cheap relative to a company's earnings and net assets. Benjamin Graham sowed the philosophy (margin of safety); the empirical proof came later — the 'cheap on earnings' effect from Basu (1977), the 'cheap on net assets' effect from Rosenberg et al. (1985), formalized by Fama and French as the HML value premium. The premise: the market oversells unpopular stocks.",
      note: "Value: the 'cheap on earnings' effect (Basu 1977, E/P) and the 'cheap on net assets' effect (Rosenberg et al. 1985, formalized as Fama-French HML, B/M) are established academic factors. Our backtest (annual formation, monthly long-short, low cost) reproduces the positive direction, and our value signal genuinely maps to the academic HML factor (βHML positive and large = 'our value is the academic value factor'). But the strength and statistical significance of the premium drift with the sample window (B/M is consistently stronger than E/P), so we do not pin a specific t-value. ⚠️ Value's ~15-year slump (growth has led) is an open academic debate about a weakening premium (Fama-French 2021: the second-half premium fell, though volatility is too high to call it 'dead'), so we cannot claim it 'works in the current period'. The on-screen verdict is PER-based (E/P: KR = last annual = Basu's basis / US = trailing twelve months), and losses (net income 0 or below) are excluded from scoring, as in Basu and FF. The universe is 'today's top names' (US and KR by market cap), so survivorship bias applies, and PER and PBR are absolute single-stock figures — compare within the same industry to avoid misreading. Not a prediction or a guarantee.",
      scope: {
        verified: "The 'value premium' confirmed in the data by Basu (1977, on earnings) and Rosenberg et al. (1985) / Fama-French (net assets, HML) — the cheap group beat the expensive group over long-run averages (Graham is the philosophical root). It is not a claim that one cheap stock will rise.",
        failure: "'Value traps' are common — cheap for a reason (a structurally declining business can stay cheap and fall further). Growth has led for the last ~15 years, and academics are still debating whether the premium has weakened (Fama-French 2021).",
        when: "For the long game, read whether it is relatively cheap within the same sector (ignoring sector and growth misreads it). The verdict is earnings-based (PER, E/P), but book-to-market (PBR, B/M) was stronger in our backtest, so check PBR too.",
      },
    },
    quality: {
      name: "Quality",
      question: "Does it earn well?",
      shortLabel: "Profitability",
      what: "How efficiently a company turns its assets into profit — good for finding sturdy, high-quality names.",
      about: "Gauges company quality by gross profits divided by assets ('gross profitability'). Novy-Marx showed in 2013 that quality matters as much as cheapness — companies that reliably squeeze profit from their assets tend to do better over the long run.",
      note: "Quality (Gross Profitability — Novy-Marx 2013): gross profit (revenue − COGS) ÷ same-year total assets. In the original, the high−low long-short earned a significant alpha beyond market/size/value (FF3) of ~0.5%/month (t≈4.5), and because it is negatively correlated with value (B/M) it was verified as 'the other side of value' — independent of and complementary to value. Our backtest also points positive and independent of value (βHML negative), but the strength drifts with the sample window, so we do not pin a specific t-value (the return 'level' is overstated by survivorship and equal weighting; universe = today's top 1,000, US and KR by market cap). ⚠️ Follow-up work (Ball et al. 2015, 'Deflating Profitability') argues much of the effect comes from the denominator (dividing by total assets mixes in a value component) and proposes operating profitability; Fama-French moved to operating profitability in their five-factor model — deflator sensitivity is a real limitation. The original was strongest combined with value ('buy profitable value firms'), not standalone. Banks, insurers and other financials with no gross-profit line are excluded from scoring (the original excludes financials too), but this is driven by whether a gross-profit line is reported rather than an explicit sector filter, so some (e.g. REITs) can still get a value. 'Quality' is a broad term — here it is narrowed to this one profitability metric (the profitability leg of QMJ's profitability/growth/safety). Not a prediction or a guarantee.",
      scope: {
        verified: "Novy-Marx (2013) showed gross profitability (gross profit / assets) predicts as well as value (book-to-market) — 'the other side of value,' independent of value with a significant FF3 alpha. Confirmed on group comparisons.",
        failure: "It is not a standalone stock picker — it was strongest combined with value (profitable value firms). A follow-up critique (Ball et al. 2015) argues much of the effect comes from the total-assets denominator, and banks/insurers with no gross-profit line do not compute (some financials like REITs can still get a value).",
        when: "Read it alongside value — whether it earns relatively well on its assets versus the market.",
      },
    },
    assetgrowth: {
      name: "Asset Growth",
      question: "Did it expand too fast?",
      shortLabel: "Asset discipline",
      what: "How fast a company is expanding its asset base — growing too aggressively has historically meant weaker returns afterward.",
      about: "Tracks how aggressively a company grows its assets through capex, acquisitions, and the like. Cooper, Gulen, and Schill showed in 2008 that firms expanding fastest tended to underperform later — a caution against overinvestment and empire-building. It's the investment factor (CMA) in the Fama-French five-factor model, favoring companies that spend capital with discipline.",
      note: "Asset Growth (the investment factor — Cooper-Gulen-Schill 2008 / CMA in the Fama-French 5-factor model, same family): year-over-year growth in total assets ((current − prior) / prior). The anomaly — firms that expand assets aggressively tend to earn less afterward — is academic consensus and held up in large-scale replication (Hou-Xue-Zhang 2020: it survived where two-thirds of 447 anomalies did not). It is independent of value (low βHML — a separate 'capital discipline' axis). ⚠️ But the original's large effect (low−high ~20%/yr) leans heavily on small and microcaps and equal weighting — replication shows it shrinks a lot in large-cap, value-weighted samples. Our universe is today's top ~1,000 (US and KR by market cap), which does not fully hold the microcap segment where the effect is strongest, so in our sample the direction is positive but statistically weak (not because the effect is fake, but because we do not hold the segment where it lives). The interpretation is debated (CGS: behavioral overinvestment and over-extrapolation; q-theory: rational investment choice — the direction is agreed, the cause is not). Banks and insurers were excluded in the original CGS study but get a value here because they have total assets (a bank's asset growth is deposit and loan expansion — a different meaning than a manufacturer's capex, so interpret with care). The universe is 'today's top names', so survivorship bias applies. Not a prediction or a guarantee.",
      scope: {
        verified: "Cooper-Gulen-Schill (2008) showed firms that grew assets fast tended to lag afterward (the investment factor, FF5 CMA). It held up in large-scale replication too — a robust axis. It is a group comparison.",
        failure: "Much of the effect comes from small and microcaps — our universe (today's top ~1,000, US and KR by market cap) does not fully hold that segment, so it was statistically weak in our sample. The direction (caution on overexpansion) is consensus but thin in large caps (the original finds the large-cap effect weak too). Banks were excluded in the original CGS study but get a value here because they report total assets — a bank's asset growth is deposit and loan expansion, so interpret with care.",
        when: "Treat it as a reference axis for capital discipline — whether expansion is relatively conservative within the market.",
      },
    },
    technical: {
      name: "Technical",
      question: "Is the current trend up or down?",
      shortLabel: "Short-term trend",
      what: "Reads the chart for overheating and which way the trend leans — a quick gut-check, for reference only.",
      about: "Traditional technical analysis — reading price and chart patterns to gauge whether a stock is overheated or which way the trend leans. RSI (Welles Wilder, 1978) flags overbought/oversold; a moving average is just the average price over a period. A quick scan of short-term momentum (weak on its own).",
      note: "Technical indicators are the only lens of the seven that is not an academically validated factor (reference only). The verdict (above/below) is based on the 200-day moving average; RSI and 52-week position are shown alongside but do not drive it. · RSI (Wilder 1978): the 30/70 overbought/oversold levels are Wilder's own rule of thumb, not a statistical result. Buying oversold (low-RSI long) showed no return edge in our re-test (monthly long-short) and its high turnover only adds cost — it does not work as a trade signal. · 200-day trend: moving-average trend rules are cousins of trend-following / time-series-momentum research (Moskowitz et al. 2012; Faber 2007), but that evidence is at the index / asset-class level (not individual stocks), and the classic test (Brock et al. 1992) lost significance once data-snooping was corrected (Sullivan-Timmermann-White 1999) — so we cannot call it 'validated.' In our re-test the 200-day trend does point positive, but it largely overlaps (cross-sectional) momentum, so it is not an independent signal. → RSI, 52-week position and moving averages only show 'where things stand now'; they are not trade signals. Judge trend with the momentum lens. Given individual-stock noise, transaction costs and data-snooping, do not rely on it alone.",
      scope: {
        verified: "RSI (Wilder 1978) and moving averages are long-standing practitioner tools. Unlike the other lenses, they are not academically validated factors — RSI's 30/70 is Wilder's rule of thumb (not a test result), and buying oversold did not work in our re-test either.",
        failure: "It is not a trade signal, just a read of 'where things stand now.' The 200-day trend is a cousin of trend-following research, but that is at the index level, and even the classic test lost significance after data-snooping correction (STW 1999); on individual stocks it is noisy and largely overlaps momentum.",
        when: "Treat it as reference only. Judge trend with the momentum lens.",
      },
    },
    fscore: {
      name: "F-Score", subtitle: "financial health",
      question: "Are the financials solid?",
      shortLabel: "Financial health",
      what: "Scores a company's financial health across 9 checks — a filter to weed out weak balance sheets (not a return forecast).",
      na: "Not enough financial data to score this one.",
      about: "A checklist created by accounting professor Piotroski in 2000 that scores financial health on 9 points (year-over-year gains in profitability, debt, and efficiency). It was built to weed out the genuinely weak names among cheap value stocks — so it judges financial health, not future returns.",
      scope: {
        verified: "Piotroski (2000) showed that, 'within the cheap value-stock (high-B/M) group,' picking firms whose financials are improving did better (high score 8-9 vs low score 0-1). It is a tool for weeding out weak names.",
        failure: "The original scope is a tool within the value-stock group (not a general quality score for all stocks) — its edge was concentrated in small/mid-cap neglected value names and was weak among large caps. Banks and insurers can't be scored (no current ratio and other inputs). A high score does not mean the stock will rise, and our 'Strong (≥7)' is our own banding (Piotroski's 'high' is 8-9).",
        when: "For avoiding distress — read whether the financials improved year over year.",
      },
    },
  },
};

// ── 직관 판정(reading) — 렌즈가 이 종목을 어떻게 읽는지 "판정 문장 + 쉬운 해석"(상태별·언어별). ──
// 원칙: 예측 아님(상단 공통 전제) · 각 기법 시각 · 숫자는 카드에 그대로(근거 수치) · 쉬운말. 상태키=lib/lenses가 계산.
type Reading = { phrase: string; plain: string };
type LensReadings = Record<string, Reading>;

export const LENS_READINGS: Record<Locale, {
  momentum: LensReadings; lowvol: LensReadings; valuation: LensReadings; quality: LensReadings; assetgrowth: LensReadings; technical: LensReadings; fscore: LensReadings;
}> = {
  ko: {
    momentum: {
      // 상대(횡단면 순위) 표현 — 컷이 시장 분포라 절대 방향 단정 금지(STEP 806 §1). 절대 수치는 headline 참고.
      up: { phrase: "모멘텀 상위권", plain: "12-1 모멘텀이 시장에서 상위권이에요. 이 기법은 상대적으로 앞선 종목을 눈여겨봐요 (절대 수치는 위 숫자 참고)." },
      upNeg: { phrase: "내렸지만 상위권", plain: "최근엔 내렸지만 하락 폭이 시장에서 작은 편이라 모멘텀은 상위권이에요 (절대 수치는 위 숫자 참고)." },
      flat: { phrase: "모멘텀 중간권", plain: "12-1 모멘텀이 시장 중간권이에요. 이 기법 시각에선 두드러진 신호가 없어요." },
      down: { phrase: "모멘텀 하위권", plain: "12-1 모멘텀이 시장에서 하위권이에요. 이 기법은 상대적으로 뒤처진 흐름으로 봐요." },
      downPos: { phrase: "올랐지만 하위권", plain: "최근엔 올랐지만 상승 폭이 시장에서 작은 편이라 모멘텀은 하위권이에요 (절대 수치는 위 숫자 참고)." },
    },
    lowvol: {
      calm: { phrase: "변동 낮은 편(시장 대비)", plain: "가격 변동이 시장에서 적은 편이에요. 하락장에서 방어적으로 버티는 성격이에요 (수익 방향 아님)." },
      calmHigh: { phrase: "시장 대비 낮지만 절대론 큼", plain: "시장에선 변동이 적은 편이지만 절대 수준은 낮지 않아요 — 연변동성이 40%(우리가 정한 대략적 실무 기준·원전 근거 아님)를 넘어요. 하락장 방어 관점이에요." },
      mid: { phrase: "변동 중간권", plain: "가격 변동이 시장에선 중간권이에요 — 절대 수준은 위 '연변동성' 숫자로 확인하세요(시장 중간이 절대적으로 낮다는 뜻은 아니에요)." },
      jumpy: { phrase: "변동 높은 편(시장 대비)", plain: "가격 변동이 시장에서 큰 편이에요. 변동을 감당할 수 있을 때 어울려요 (수익 방향 아님)." },
    },
    valuation: {
      cheap: { phrase: "싼 편(시장 대비)", plain: "이익 대비 주가가 시장에서 싼 편이에요. 길게 보는 가치 관점에서 눈여겨보는 특징이에요." },
      mid: { phrase: "밸류 중간권", plain: "이익 대비 주가가 시장 중간권이에요." },
      rich: { phrase: "비싼 편(시장 대비)", plain: "이익 대비 주가가 시장에서 비싼 편이에요. 성장 기대가 미리 반영됐을 수 있어요." },
      na: { phrase: "산출 불가", plain: "이익 데이터가 없어 이 기법으론 판단하기 어려워요." },
      naLoss: { phrase: "적자 (판정 제외)", plain: "지금 적자예요 — PER은 이익이 양수일 때만 의미가 있어 이 기법을 적용하지 않아요(원전 바수·FF도 적자는 제외)." },
      naPreferred: { phrase: "우선주 (판정 제외)", plain: "우선주라 보통주 기준 PER·PBR이 왜곡돼 이 기법을 적용하지 않아요." },
      naMissing: { phrase: "산출 불가", plain: "이익 데이터가 없어 이 기법으론 판단하기 어려워요." },
    },
    quality: {
      high: { phrase: "수익성 상위권", plain: "자산 대비 수익성이 시장 상위권이에요. 질 좋은 우량주를 고를 때 눈여겨보는 특징이에요." },
      mid: { phrase: "수익성 중간권", plain: "자산 대비 수익성이 시장 중간권이에요." },
      low: { phrase: "수익성 하위권", plain: "자산 대비 수익성이 시장에서 낮은 편이에요." },
      na: { phrase: "산출 불가", plain: "재무 데이터가 부족해 이 기법으론 판단하기 어려워요." },
      naNoGrossProfit: { phrase: "산출 불가 (매출총이익 미보고)", plain: "이 회사는 매출총이익(매출−매출원가)을 보고하지 않아 이 기법을 적용할 수 없어요." },
      naMissing: { phrase: "산출 불가", plain: "재무 데이터가 부족해 이 기법으론 판단하기 어려워요." },
    },
    assetgrowth: {
      aggressive: { phrase: "확장 공격적(시장 대비)", plain: "자산 확장이 시장에서 공격적인 편이에요. 역사적으로 급히 몸집을 키운 회사는 이후 성과가 약한 편이라 참고해서 볼 신호예요." },
      mid: { phrase: "확장 중간권", plain: "자산 확장 속도가 시장 중간권이에요." },
      conservative: { phrase: "확장 보수적(시장 대비)", plain: "자산 확장이 시장에서 보수적인 편이에요. 역사적으로 자본을 아껴 쓰는 회사가 이후 성과가 나은 편이었어요." },
      na: { phrase: "산출 불가", plain: "재무 정보가 부족해 이 기법으론 판단하기 어려워요." },
      naOneYear: { phrase: "산출 불가 (재무 1년치)", plain: "전년 대비 증가율이라 2개 회계연도가 필요한데 1년치만 있어요." },
      naGap: { phrase: "산출 불가 (연도 불연속)", plain: "재무 연도가 연속되지 않아(중간에 빠진 해가 있어) 전년 대비 계산이 안 돼요." },
      naMissing: { phrase: "산출 불가", plain: "재무 데이터가 부족해 이 기법으론 판단하기 어려워요." },
    },
    technical: {
      up: { phrase: "상승 추세", plain: "지금 가격이 장기 평균선 위에 있어요. 단기 흐름을 빠르게 훑는 참고용이에요." },
      flat: { phrase: "추세 불분명", plain: "장기 평균선 근처를 오가는 상태예요. 참고용으로만 보세요." },
      down: { phrase: "하락 추세 (200일선 아래)", plain: "지금 가격이 장기 평균선 아래에 있어요. 단기 상태를 참고하는 용도예요." },
    },
    fscore: {
      strong: { phrase: "재무 양호", plain: "재무 건전성이 좋은 편이에요 — 9개 중 대부분 통과. 부실할 가능성은 낮아요(단, 오를지 예측은 아니에요)." },
      mid: { phrase: "재무 보통", plain: "재무 건전성은 보통이에요 — 아주 튼튼하지도, 부실하지도 않아요. 부실 회사를 거를 때 보는 참고용이지 오를지 예측은 아니에요." },
      weak: { phrase: "재무 취약", plain: "재무가 약한 편이에요 — 통과 항목이 적어요. 부실 위험을 참고하는 신호예요(예측은 아님)." },
      na: { phrase: "산출 불가", plain: "재무 데이터가 부족해 이 점수를 낼 수 없어요." },
    },
  },
  en: {
    momentum: {
      // Relative (cross-sectional rank) — cuts are market distribution, so no absolute-direction claims (STEP 806 §1). See headline for the raw number.
      up: { phrase: "Top-tier momentum", plain: "Its 12-1 momentum ranks near the top of the market. This lens favors relatively leading names (see the number above for the raw figure)." },
      upNeg: { phrase: "Down, yet top-ranked", plain: "It has slipped lately, but its decline is milder than most, so momentum still ranks high (see the number above)." },
      flat: { phrase: "Mid-pack momentum", plain: "Its 12-1 momentum sits mid-market. No standout signal from this lens right now." },
      down: { phrase: "Bottom-tier momentum", plain: "Its 12-1 momentum ranks near the bottom of the market. This lens reads it as relatively lagging." },
      downPos: { phrase: "Up, yet bottom-ranked", plain: "It has risen lately, but its gain is smaller than most, so momentum ranks low (see the number above)." },
    },
    lowvol: {
      calm: { phrase: "Low swings (vs. market)", plain: "Its price moves less than most in the market — a defensive profile in down markets (not a return call)." },
      calmHigh: { phrase: "Low vs. market, high in absolute", plain: "It swings less than most in the market, but the absolute level is not low — its annualized volatility is above 40% (a rough practical line we set, not from the source paper). A defensive-in-down-markets view." },
      mid: { phrase: "Mid-pack volatility", plain: "Its price movement sits mid-market — check the annualized volatility above for the absolute level (mid-market does not mean low in absolute terms)." },
      jumpy: { phrase: "High swings (vs. market)", plain: "Its price moves more than most in the market. Suits you when you can stomach the swings (not a return call)." },
    },
    valuation: {
      cheap: { phrase: "Cheap (vs. market)", plain: "Relative to earnings, its price is on the cheaper side of the market — a value profile worth watching in the long game." },
      mid: { phrase: "Mid-pack valuation", plain: "Relative to earnings, its price sits mid-market." },
      rich: { phrase: "Pricey (vs. market)", plain: "Relative to earnings, its price is on the pricier side of the market — growth expectations may be priced in." },
      na: { phrase: "Can't be scored", plain: "No earnings data, so this lens can't judge it." },
      naLoss: { phrase: "Loss-making (excluded)", plain: "It is currently loss-making — PER is only meaningful with positive earnings, so this lens does not apply (Basu and FF also exclude losses)." },
      naPreferred: { phrase: "Preferred share (excluded)", plain: "As a preferred share, PER and PBR on a common-share basis are distorted, so this lens does not apply." },
      naMissing: { phrase: "Can't be scored", plain: "No earnings data, so this lens can't judge it." },
    },
    quality: {
      high: { phrase: "Top-tier profitability", plain: "Its profitability versus assets ranks near the top of the market — a high-quality profile worth watching." },
      mid: { phrase: "Mid-pack profitability", plain: "Its profitability versus assets sits mid-market." },
      low: { phrase: "Bottom-tier profitability", plain: "Its profitability versus assets is on the low side of the market." },
      na: { phrase: "Can't be scored", plain: "Not enough financial data for this lens to judge." },
      naNoGrossProfit: { phrase: "Can't be scored (no gross profit)", plain: "This company does not report gross profit (revenue − COGS), so this lens cannot be applied." },
      naMissing: { phrase: "Can't be scored", plain: "Not enough financial data for this lens to judge." },
    },
    assetgrowth: {
      aggressive: { phrase: "Aggressive expansion (vs. market)", plain: "Its asset expansion is among the more aggressive in the market. Historically, fast bulkers have tended to lag afterward — a signal to watch." },
      mid: { phrase: "Mid-pack expansion", plain: "Its asset expansion pace sits mid-market." },
      conservative: { phrase: "Conservative expansion (vs. market)", plain: "Its asset expansion is among the more conservative in the market. Historically, disciplined spenders have tended to fare better afterward." },
      na: { phrase: "Can't be scored", plain: "Not enough financial data for this lens to judge." },
      naOneYear: { phrase: "Can't be scored (only 1 year)", plain: "This is a year-over-year growth rate, which needs two fiscal years — only one is available." },
      naGap: { phrase: "Can't be scored (non-consecutive years)", plain: "The fiscal years are not consecutive (a year is missing), so the year-over-year change cannot be computed." },
      naMissing: { phrase: "Can't be scored", plain: "Not enough financial data for this lens to judge." },
    },
    technical: {
      up: { phrase: "Trend leans up", plain: "The price sits above its long-term average. A quick read of short-term action, for reference." },
      flat: { phrase: "No clear trend", plain: "It's hovering near its long-term average. Treat this as reference only." },
      down: { phrase: "Trend leans down", plain: "The price sits below its long-term average. For reference on the current state." },
    },
    fscore: {
      strong: { phrase: "Financially strong", plain: "It passes many of the 9 checks — solid financial health (not a return forecast)." },
      mid: { phrase: "Financially fair", plain: "It passes about half of the 9 checks." },
      weak: { phrase: "Financially weak", plain: "It passes few checks — financials may be weak, so look carefully." },
      na: { phrase: "Can't be scored", plain: "Not enough financial data to score this." },
    },
  },
};

// 스펙트럼 3구간 라벨 [왼쪽, 가운데, 오른쪽] — 이 종목이 이 기법 눈엔 어디쯤인지 위치로. 켜지는 칸=lib/lenses가 상태로 계산.
export const SPECTRUM_LABELS: Record<Locale, {
  momentum: [string, string, string]; lowvol: [string, string, string]; valuation: [string, string, string]; quality: [string, string, string]; assetgrowth: [string, string, string]; technical: [string, string, string]; fscore: [string, string, string];
}> = {
  ko: {
    // 모멘텀은 분포 순위(상대)라 스펙트럼도 순위 표현 — 806의 상대 verdict와 정합(STEP 808 §4). "강세/약세"(절대) 금지.
    momentum: ["하위권", "중간", "상위권"],
    lowvol: ["변동 낮음", "중간", "변동 높음"],
    valuation: ["싼 편", "중간", "비싼 편"],
    quality: ["하위권", "중간", "상위권"],
    assetgrowth: ["보수적", "중간", "공격적"],
    technical: ["추세 아래", "중립", "추세 위"],
    fscore: ["약함", "보통", "튼튼"],
  },
  en: {
    momentum: ["Bottom", "Mid", "Top"],
    lowvol: ["Low vol", "Mid", "High vol"],
    valuation: ["Cheap", "Mid", "Pricey"],
    quality: ["Bottom", "Mid", "Top"],
    assetgrowth: ["Conservative", "Mid", "Aggressive"],
    technical: ["Below", "Neutral", "Above"],
    fscore: ["Weak", "Medium", "Strong"],
  },
};

// "이 기법 방향" — 그 기법 '방법대로'의 방향(시간축 + 유리/불리/중립 + 정직 꼬리표). 예측 아님(역사적 base-rate 경향).
// 모든 기법이 수익 방향은 아님: 저변동=위험 / F-Score=건전성 / 기술=상태 축을 지킴.
export const LENS_OUTLOOK: Record<Locale, {
  momentum: Record<string, string>; lowvol: Record<string, string>; valuation: Record<string, string>; quality: Record<string, string>; assetgrowth: Record<string, string>; technical: Record<string, string>; fscore: Record<string, string>;
}> = {
  ko: {
    momentum: {
      up: "단기~중기 유리한 편 — 모멘텀 상위권 종목이 역사적으로 한동안 상대 우위였던 경향 (검증된 경향·보장은 아님).",
      flat: "지금은 뚜렷한 방향 없음 — 모멘텀이 중간권이라 이 기법 신호가 약해요.",
      down: "단기~중기 불리한 편 — 모멘텀 하위권 흐름은 한동안 이어지기 쉬운 편이에요 (검증된 경향·보장 아님).",
    },
    lowvol: {
      calm: "위험: 시장 대비 낮은 편(방어적) — 수익 방향이 아니라 '덜 흔들린다'는 관점이에요.",
      calmHigh: "위험: 시장 대비 낮지만 절대 수준은 높아요 — 덜 흔들린다는 상대 관점(수익 방향 아님).",
      mid: "위험: 보통 — 수익 방향이 아니라 변동성 관점이에요.",
      jumpy: "위험: 시장 대비 큰 편 — 크게 출렁여요. 변동을 감당할 수 있을 때 (수익 방향 아님).",
    },
    valuation: {
      cheap: "장기 유리한 편 — 싼 주식은 역사적으로 장기 우위 (가치 프리미엄, 단 최근 표본선 약함).",
      mid: "장기: 중립 — 가격이 특별히 싸지도 비싸지도 않아요.",
      rich: "장기 불리한 편 — 비싼 주식은 역사적으로 장기 수익이 약한 편 (단, 우리 표본선 약함).",
      na: "판단 보류 — 이 종목엔 이 기법을 적용하지 않았어요 (사유는 위 참고).",
    },
    quality: {
      high: "장기 유리한 편 — 알짜 우량주는 역사적으로 장기 우위 (검증된 경향).",
      mid: "장기: 중립 — 수익성이 특별히 높지도 낮지도 않아요.",
      low: "장기 불리한 편 — 수익성 낮은 회사는 역사적으로 장기 열위 (검증된 경향).",
      na: "판단 보류 — 이 종목엔 이 기법을 적용하지 않았어요 (사유는 위 참고).",
    },
    assetgrowth: {
      aggressive: "길게 보면 불리한 편 — 몸집을 공격적으로 키운 회사는 이후 성과가 약했어요 (다만 근거는 아직 약해요).",
      mid: "장기: 중립 — 성장 속도가 과하지도 정체도 아니에요.",
      conservative: "길게 보면 유리한 편 — 자본을 아껴 쓴 회사가 이후 더 나았어요 (다만 근거는 아직 약해요).",
      na: "판단 보류 — 이 종목엔 이 기법을 적용하지 않았어요 (사유는 위 참고).",
    },
    technical: {
      up: "단기 상태: 추세 위 — 참고용이에요 (모멘텀과 겹치는 신호).",
      flat: "단기 상태: 방향 불분명 — 참고용.",
      down: "단기 상태: 추세 아래 — 참고용이에요 (모멘텀과 겹치는 신호).",
    },
    fscore: {
      strong: "건전성: 좋은 편 — 부실 가능성 낮아요 (수익 방향 예측은 아님).",
      mid: "건전성: 중간 — 부실 회피 참고용이지 수익 방향은 아니에요.",
      weak: "건전성: 약한 편 — 부실 위험 참고 신호예요 (수익 방향 아님).",
      na: "점수 불가 — 데이터 부족.",
    },
  },
  en: {
    momentum: {
      up: "Short-to-mid term: leans favorable — top-ranked momentum names have historically held a relative edge for a while (validated tendency, not a guarantee).",
      flat: "No clear direction now — momentum is mid-pack, so this lens' signal is faint.",
      down: "Short-to-mid term: leans unfavorable — bottom-ranked momentum has tended to persist too (validated, not a guarantee).",
    },
    lowvol: {
      calm: "Risk: low vs. market (defensive) — a risk view, not a return call.",
      calmHigh: "Risk: low vs. market but high in absolute terms — a relative view of steadiness (not a return call).",
      mid: "Risk: average — a volatility view, not a return call.",
      jumpy: "Risk: high vs. market — it swings a lot; for those who can stomach it (not a return call).",
    },
    valuation: {
      cheap: "Long term: leans favorable — cheap stocks have historically won long-term (value premium; weak in our recent sample).",
      mid: "Long term: neutral — neither especially cheap nor pricey.",
      rich: "Long term: leans unfavorable — pricey stocks have historically lagged long-term (weak in our sample).",
      na: "On hold — this lens was not applied to this stock (see the reason above).",
    },
    quality: {
      high: "Long term: leans favorable — high-quality names have historically won long-term (validated).",
      mid: "Long term: neutral — profitability is middling.",
      low: "Long term: leans unfavorable — low-profitability names have historically lagged (validated).",
      na: "On hold — this lens was not applied to this stock (see the reason above).",
    },
    assetgrowth: {
      aggressive: "Long term: leans unfavorable — aggressive expanders have historically lagged afterward (weak in our sample).",
      mid: "Long term: neutral — growth pace is moderate.",
      conservative: "Long term: leans favorable — disciplined spenders have historically fared better (weak in our sample).",
      na: "On hold — this lens was not applied to this stock (see the reason above).",
    },
    technical: {
      up: "Short-term state: trend up — reference only (overlaps momentum).",
      flat: "Short-term state: unclear — reference only.",
      down: "Short-term state: trend down — reference only (overlaps momentum).",
    },
    fscore: {
      strong: "Health: good — low distress odds (not a return forecast).",
      mid: "Health: medium — a distress-avoidance check, not a return call.",
      weak: "Health: weak — a distress-risk flag (not a return call).",
      na: "Can't score — not enough data.",
    },
  },
};

// ── 근거 수치(detail) 라벨 — 키는 언어중립(stable), 표시만 언어별. ──
// 이전엔 한국어 리터럴이 곧 키였음(en 화면에 한국어 라벨 누출) → 키/라벨 분리.
// ⚠️ ko 값은 기존 lib/lenses.ts detail 키와 바이트 동일(KR 화면 무회귀 — lenses.charac.test.ts가 고정).
export type DetailKey =
  | "mom12_1" | "ret1m" | "ret3m" | "ret6m" | "ret12m"
  | "rsi14" | "ma200vs" | "pos52w"
  | "per" | "pbr"
  | "vol"
  | "gpa"
  | "ag"
  // STEP 831 §10-①: 퀄리티 GP/A 구성요소 분해 라벨(매출·원가·매출총이익·총자산·마진·회전율).
  | "revenue" | "cogs" | "grossProfit" | "totalAssets" | "grossMargin" | "assetTurnover";

export const DETAIL_LABELS: Record<Locale, Record<DetailKey, string>> = {
  ko: {
    mom12_1: "12-1모멘텀%", ret1m: "1개월%", ret3m: "3개월%", ret6m: "6개월%", ret12m: "12개월%",
    rsi14: "RSI(14)", ma200vs: "200일선대비%", pos52w: "52주위치%",
    per: "PER", pbr: "PBR",
    vol: "연변동성%",
    gpa: "GP/A%",
    ag: "자산성장%",
    revenue: "매출", cogs: "매출원가", grossProfit: "매출총이익", totalAssets: "총자산",
    grossMargin: "매출총이익률%", assetTurnover: "자산회전율×",
  },
  en: {
    mom12_1: "12-1 Momentum %", ret1m: "1M %", ret3m: "3M %", ret6m: "6M %", ret12m: "12M %",
    rsi14: "RSI(14)", ma200vs: "vs MA200 %", pos52w: "52W position %",
    per: "PER", pbr: "PBR",
    vol: "Ann. volatility %",
    gpa: "GP/A %",
    ag: "Asset growth %",
    revenue: "Revenue", cogs: "Cost of revenue", grossProfit: "Gross profit", totalAssets: "Total assets",
    grossMargin: "Gross margin %", assetTurnover: "Asset turnover ×",
  },
};

// ── short/long 방향 라벨 — 상태키(언어중립) → 표시 라벨(언어별). ──
// 이전엔 lib/momentum·lowvol·technical과 lenses.ts 인라인이 한국어를 직접 반환(en 화면 누출·현재는 미렌더라 잠복).
// ⚠️ 임계값은 렌즈마다 달라(예: 저변동 라벨 25/45 vs 상태 20/40) 계산은 각 계산모듈이 그대로 하고, 여기선 "표시"만 한다.
// ⚠️ ko 값 = 기존 한국어 리터럴과 바이트 동일(KR 무회귀 — lenses.charac.test.ts가 고정).
export const LEVEL_LABELS: Record<Locale, {
  trend: Record<"strong" | "neutral" | "weak", string>;      // 모멘텀 short(1·3개월 절대 추세 — "강세/약세" 유지)
  momrank: Record<"strong" | "neutral" | "weak", string>;    // 모멘텀 long(12-1 분포 순위 — 상대 표현·STEP 808 §4)
  rsi: Record<"hot" | "cold" | "neutral", string>;           // 기술 short
  ma: Record<"up" | "down", string>;                         // 기술 long
  per: Record<"cheap" | "mid" | "rich", string>;             // 밸류 long(PER 수준 — verdict 아님)
  vol: Record<"low" | "mid" | "high", string>;               // 저변동 long
  gpa: Record<"high" | "mid" | "low", string>;               // 퀄리티 long
  growth: Record<"aggressive" | "mid" | "conservative", string>; // 자산성장 long
}> = {
  ko: {
    trend: { strong: "강세", neutral: "중립", weak: "약세" },
    momrank: { strong: "상위권", neutral: "중간", weak: "하위권" },
    rsi: { hot: "과열", cold: "침체", neutral: "중립" },
    ma: { up: "상승추세", down: "하락추세" },
    per: { cheap: "낮음", mid: "보통", rich: "높음" },
    vol: { low: "저변동", mid: "보통", high: "고변동" },
    gpa: { high: "높음", mid: "보통", low: "낮음" },
    growth: { aggressive: "공격적", mid: "보통", conservative: "보수적" },
  },
  en: {
    trend: { strong: "Strong", neutral: "Neutral", weak: "Weak" },
    momrank: { strong: "Top-tier", neutral: "Mid", weak: "Bottom-tier" },
    rsi: { hot: "Overbought", cold: "Oversold", neutral: "Neutral" },
    ma: { up: "Uptrend", down: "Downtrend" },
    per: { cheap: "Low", mid: "Average", rich: "High" },
    vol: { low: "Low volatility", mid: "Average", high: "High volatility" },
    gpa: { high: "High", mid: "Average", low: "Low" },
    growth: { aggressive: "Aggressive", mid: "Moderate", conservative: "Conservative" },
  },
};

// 카드 겉면 headline의 언어별 접두어(숫자 앞 단어). 모멘텀 `12-1`·밸류 `PER`·퀄리티 `GP/A`는 언어중립이라 여기 없음.
export const HEADLINE_PREFIX: Record<Locale, { technical: string; lowvol: string; assetgrowth: string }> = {
  ko: { technical: "200일선", lowvol: "연변동성", assetgrowth: "자산성장" },
  en: { technical: "vs MA200", lowvol: "Ann. vol", assetgrowth: "Asset growth" },
};

// STEP 805 기타 문구 — 분포 컷 미존재(기준 준비 중)·PER 기준 명시.
export const LENS_MISC: Record<Locale, {
  pendingPhrase: string; pendingPlain: string;
  cutsErrorPhrase: string; cutsErrorPlain: string; // 컷 '조회 실패'(일시 오류) — pending(기준 준비 중)과 구분·STEP 808 §2
  perBasis: string; // PER 산출 기준(외부 TTM과 다름·STEP 805 §5)
}> = {
  ko: {
    pendingPhrase: "기준 준비 중",
    pendingPlain: "이 시장의 판정 기준(분포)을 아직 모으는 중이에요 — 값은 위에 그대로 있어요.",
    cutsErrorPhrase: "기준을 불러오지 못했어요",
    cutsErrorPlain: "판정 기준을 일시적으로 불러오지 못했어요 — 값은 위에 그대로 있어요. 잠시 후 다시 시도해 주세요.",
    perBasis: "연간 실적 기준",
  },
  en: {
    pendingPhrase: "Calibrating",
    pendingPlain: "We are still gathering this market's baseline distribution — the number above stands on its own.",
    cutsErrorPhrase: "Could not load the baseline",
    cutsErrorPlain: "We could not load the verdict baseline just now — the number above stands on its own. Please try again in a moment.",
    perBasis: "based on last fiscal year",
  },
};

// 신뢰도 등급 배지 텍스트 — 렌즈 카드 겉면("얼마나 믿을 만한가"). 색 계열(gradeTier)은 언어 무관이라 별도.
// ⚠️ ko 값은 기존 lib/lenses.ts 리터럴과 바이트 동일(스냅샷 테스트·KR 화면 무회귀). en은 신뢰도 범례(StockLens.readingGuide)와 문구 일치.
export type GradeKey = "verified" | "verifiedDefensive" | "reference" | "weakSignal";

export const LENS_GRADE: Record<Locale, Record<GradeKey, string>> = {
  ko: { verified: "검증", verifiedDefensive: "검증(방어)", reference: "참고용", weakSignal: "약한 신호" },
  en: { verified: "Verified", verifiedDefensive: "Verified (defensive)", reference: "Reference", weakSignal: "Weak signal" },
};

export function pickLocale(v: string | null | undefined): Locale {
  return v === "en" ? "en" : "ko";
}

// 렌즈 이름/상태 문구 공용 조회 — TodayClient·ExploreClient 로컬 lensName/stateLabel과 동일 로직(STEP 778: 신규 daily-brief 라우트용, 기존 2곳은 그대로 둠).
export function lensDisplayName(loc: Locale, key: string): string {
  return (LENS_COPY[loc] as unknown as Record<string, { name: string }>)[key]?.name ?? key;
}
export function lensStateLabel(loc: Locale, key: string, state: string | null): string {
  if (!state) return "—";
  const readings = (LENS_READINGS[loc] as unknown as Record<string, Record<string, { phrase: string }>>)[key];
  return readings?.[state]?.phrase ?? state;
}
// STEP 924: 이름+상태문구 한 줄 조립 — 일부 phrase(모멘텀 up/flat/down 등)가 이미 렌즈 이름 단어를 담고 있어
// 단순 연결(name + phrase)이 "모멘텀 모멘텀 상위권"처럼 중복된다. phrase(문구 자체)는 그대로 두고, phrase가
// 이름의 핵심 단어(괄호·공백 앞까지 — "밸류(가치)"→"밸류")를 이미 담고 있으면 이름을 생략하는 쪽만 조건부로 만든다.
export function lensStateLine(loc: Locale, key: string, state: string | null): string {
  const name = lensDisplayName(loc, key);
  const phrase = compactPhrase(lensStateLabel(loc, key, state));
  // 괄호 있는 이름("밸류(가치)")만 괄호 앞까지("밸류")로 줄인다 — 괄호 없는 다단어 이름("Low Volatility"·"Asset Growth")은
  // 통째로 비교해야 한다(첫 단어만 자르면 "Low"가 무관한 phrase와도 우연히 겹쳐 이름이 통째로 사라지는 오탐이 남).
  const core = /[(（]/.test(name) ? name.replace(/[(（].*$/, "") : name;
  return phrase.toLowerCase().includes(core.toLowerCase()) ? phrase : `${name} ${phrase}`;
}
// 카드 제목용 초보자 질문형(STEP 787) — name과 별개 필드라 6곳 소비처(문장·pill·프롬프트) 무영향.
export function lensQuestion(loc: Locale, key: string): string {
  return (LENS_COPY[loc] as unknown as Record<string, { question: string }>)[key]?.question ?? key;
}
// 종합 카드의 강점/주의 나열용 짧은 라벨(STEP 788) — question(문장형)보다 짧아 목록에 여러 개 나열해도 안 길어짐.
export function lensShortLabel(loc: Locale, key: string): string {
  return (LENS_COPY[loc] as unknown as Record<string, { shortLabel: string }>)[key]?.shortLabel ?? key;
}

// 목록 화면(오늘·탐색)용 판정 축약(STEP 819 §3) — 말미 괄호를 지우되 **상대 한정어("(시장 대비)"/"(vs. market)")는 보존**한다.
//   806·809가 상세 카드에 붙인 상대성이 목록에서 사라져 절대 표현으로 오독되던 것 방지. "(200일선 아래)" 같은 부가 설명만 축약.
//   ⚠️ 두 컴포넌트(TodayClient·ExploreClient)에 중복돼 있던 것을 여기로 공용 추출(향후 재발 방지).
export function compactPhrase(s: string): string {
  return s
    .replace(/\s*\(([^)]*)\)\s*$/, (_m, inner: string) =>
      /시장\s*대비|vs\.?\s*market/i.test(inner) ? `(${inner})` : ""
    )
    .trim();
}
