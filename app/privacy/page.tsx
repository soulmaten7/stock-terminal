export const metadata = { title: "개인정보처리방침" };

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "1. 수집하는 개인정보 항목",
    body: [
      "소셜 로그인(구글) 시: 이메일 주소, 프로필 정보(닉네임, 프로필 이미지).",
      "서비스 이용 과정에서 생성: 닉네임, 즐겨찾기 내역, 리딩방 신고·업체 인증 내역, 접속 로그·쿠키.",
      "유료 기능 이용 시(향후): 결제 내역. 현재 유료 결제는 운영하지 않습니다.",
    ],
  },
  {
    h: "2. 개인정보의 수집·이용 목적",
    body: [
      "회원 식별 및 로그인 상태 유지.",
      "즐겨찾기·관심목록 등 개인화 기능 제공.",
      "리딩방 신고·업체 인증의 접수·검토·처리 및 부정·악용 방지.",
      "서비스 운영·개선 및 문의 응대.",
    ],
  },
  {
    h: "3. 보유 및 이용 기간",
    body: [
      "원칙적으로 회원 탈퇴 시까지 보유하며, 탈퇴 시 지체 없이 파기합니다.",
      "다만 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.",
    ],
  },
  {
    h: "4. 개인정보의 제3자 제공",
    body: [
      "트릴리언은 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.",
      "법령에 근거가 있거나 수사기관의 적법한 요청이 있는 경우에 한해 제공할 수 있습니다.",
    ],
  },
  {
    h: "5. 개인정보 처리의 위탁 및 국외 이전",
    body: [
      "트릴리언은 서비스 운영을 위해 회원 인증·데이터베이스 호스팅 업무를 Supabase, Inc.에 위탁합니다.",
      "이에 따라 개인정보가 국외(미국 등)로 이전·보관될 수 있으며, 이전 항목·국가·방법은 본 방침으로 갈음합니다.",
    ],
  },
  {
    h: "6. 이용자의 권리와 행사 방법",
    body: [
      "이용자는 언제든지 자신의 개인정보를 열람·정정·삭제하거나 처리정지·회원 탈퇴를 요청할 수 있습니다.",
      "마이페이지 또는 아래 보호책임자 연락처를 통해 요청할 수 있습니다.",
    ],
  },
  {
    h: "7. 쿠키의 운영",
    body: [
      "트릴리언은 로그인 세션 유지를 위해 필수 쿠키를 사용합니다.",
      "이용자는 브라우저 설정으로 쿠키 저장을 거부할 수 있으나, 이 경우 로그인 등 일부 기능 이용이 제한될 수 있습니다.",
    ],
  },
  {
    h: "8. 개인정보의 안전성 확보 조치",
    body: [
      "트릴리언은 접근권한 관리, 전송구간 암호화(HTTPS) 등 합리적인 보호조치를 취합니다.",
    ],
  },
  {
    h: "9. 개인정보 보호책임자",
    body: ["성명·직책: 장은태 / 대표", "연락처: contact@onetrillion.app"],
  },
  {
    h: "10. 고지의 의무",
    body: ["본 방침은 법령·서비스 변경에 따라 개정될 수 있으며, 변경 시 서비스 내 공지합니다."],
  },
  {
    h: "11. 권익침해 구제방법",
    body: [
      "이용자는 개인정보 침해로 인한 상담·분쟁 조정을 아래 기관에 신청할 수 있습니다.",
      "개인정보분쟁조정위원회: 1833-6972 (www.kopico.go.kr)",
      "개인정보침해신고센터: 118 (privacy.kisa.or.kr)",
      "대검찰청 사이버수사과: 1301 (www.spo.go.kr)",
      "경찰청 사이버수사국: 182 (ecrm.police.go.kr)",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="mb-1 text-2xl font-bold text-unjong-primary">개인정보처리방침</h1>
      <p className="mb-8 text-sm text-unjong-muted">시행일: 2026-07-11</p>

      <p className="mb-8 text-sm leading-relaxed text-unjong-muted">
        트릴리언(이하 &lsquo;서비스&rsquo;)은 이용자의 개인정보를 중요하게 생각하며,
        「개인정보 보호법」 등 관련 법령을 준수합니다. 본 방침은 트릴리언이 어떤 개인정보를
        어떻게 수집·이용·보호하는지 안내합니다.
      </p>

      <div className="space-y-7">
        {SECTIONS.map((s) => (
          <section key={s.h}>
            <h2 className="mb-2 text-base font-bold text-unjong-primary">{s.h}</h2>
            <ul className="space-y-1.5">
              {s.body.map((line, i) => (
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
