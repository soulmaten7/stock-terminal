export const dynamic = "force-dynamic";
export const metadata = { title: "이용약관" };

const ARTICLES: { h: string; body: string[] }[] = [
  {
    h: "제1조 (목적)",
    body: [
      "본 약관은 어스티커(이하 '서비스')가 제공하는 투자 정보·허브 서비스의 이용 조건 및 절차, 이용자와 서비스의 권리·의무를 규정함을 목적으로 합니다.",
    ],
  },
  {
    h: "제2조 (정의)",
    body: [
      "'서비스'란 어스티커가 제공하는 채널 제작 증권사 리포트·기업 실적 전망의 정리·게시, 관심종목 등록 등 일체의 서비스를 말합니다.",
      "어스티커는 금융상품의 매매·중개·투자자문·투자일임을 제공하지 않으며, 어떠한 거래도 중개하지 않습니다.",
    ],
  },
  {
    h: "제3조 (약관의 효력 및 변경)",
    body: [
      "본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.",
      "어스티커는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 서비스 내에 사전 공지합니다.",
    ],
  },
  {
    h: "제4조 (회원가입 및 계정)",
    body: [
      "이용자는 구글 계정 소셜 로그인 또는 이메일·비밀번호 가입을 통해 회원으로 가입할 수 있습니다.",
      "계정 정보의 관리 책임은 이용자에게 있으며, 이를 타인에게 양도·대여할 수 없습니다.",
    ],
  },
  {
    h: "제5조 (서비스의 내용)",
    body: [
      "어스티커는 채널이 제작한 증권사 리포트·기업 실적 전망을 국가별로 정리하여 보여줍니다.",
      "이용자는 관심 종목을 등록해 모아볼 수 있습니다.",
      "어스티커가 제공·표시하는 정보는 참고용이며, 투자 권유나 투자 자문이 아닙니다.",
    ],
  },
  {
    h: "제6조 (면책)",
    body: [
      "어스티커는 투자 정보의 정확성·완전성·적시성을 보장하지 않으며, 이를 신뢰하여 행한 투자의 결과에 대해 책임지지 않습니다.",
      "모든 투자 판단과 그 결과의 책임은 이용자 본인에게 있습니다.",
      "어스티커가 제공하는 외부 링크 및 제3자 콘텐츠에 대하여 어스티커는 책임지지 않습니다.",
    ],
  },
  {
    h: "제7조 (서비스의 중단)",
    body: ["어스티커는 시스템 점검·장애 등의 사유로 서비스의 전부 또는 일부를 일시 중단할 수 있습니다."],
  },
  {
    h: "제8조 (준거법 및 관할)",
    body: ["본 약관은 대한민국 법령에 따라 해석되며, 분쟁은 관련 법령에 따른 관할 법원에 따릅니다."],
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold text-unjong-primary">이용약관</h1>
      <p className="mb-8 text-sm text-unjong-muted">시행일: 2026-09-06</p>

      <div className="space-y-7">
        {ARTICLES.map((a) => (
          <section key={a.h}>
            <h2 className="mb-2 text-base font-bold text-unjong-primary">{a.h}</h2>
            <ul className="space-y-1.5">
              {a.body.map((line, i) => (
                <li key={i} className="text-sm leading-relaxed text-unjong-muted">
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
