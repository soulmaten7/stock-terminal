import Link from 'next/link';

const FOOTER_SECTIONS = [
  {
    title: '서비스 안내',
    links: [
      { label: '서비스 소개', href: '/about' },
      { label: '이용가이드', href: '/guide' },
      { label: '자주 묻는 질문', href: '/faq' },
      { label: '공지사항', href: '/notice' },
    ],
  },
  {
    title: '약관/정책',
    links: [
      { label: '이용약관', href: '/terms' },
      { label: '개인정보처리방침', href: '/privacy' },
      { label: '광고 게재 약관', href: '/ad-terms' },
      { label: '환불 정책', href: '/refund-policy' },
    ],
  },
  {
    title: '광고/제휴',
    links: [
      { label: '광고 문의', href: '/advertiser' },
      { label: '제휴 문의', href: 'mailto:partner@stockterminal.com' },
      { label: '데이터 제공 문의', href: 'mailto:data@stockterminal.com' },
      { label: '미디어/언론 문의', href: 'mailto:press@stockterminal.com' },
    ],
  },
  {
    title: '고객지원',
    items: [
      '이메일: support@stockterminal.com',
      '카카오톡: @StockTerminal',
      '운영시간: 평일 09:00 ~ 18:00',
      '문의 응답: 영업일 기준 1~2일 이내',
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#0ABAB5] border-t border-[#088F8C] mt-auto">
      {/* Main Footer */}
      <div className="max-w-[1600px] mx-auto pl-16 pr-4 py-12">
        <div className="grid grid-cols-4 gap-8">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="font-bold text-white mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {'links' in section && section.links
                  ? section.links.map((link) => (
                      <li key={link.label}>
                        <Link href={link.href} className="text-sm text-white hover:text-[#C9A96E] transition-colors">
                          {link.label}
                        </Link>
                      </li>
                    ))
                  : section.items?.map((item) => (
                      <li key={item} className="text-sm text-white">
                        {item}
                      </li>
                    ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-[#088F8C] bg-[#088F8C]">
        <div className="max-w-[1600px] mx-auto pl-16 pr-4 py-6">
          <p className="text-xs text-white leading-relaxed mb-3">
            본 사이트는 공개된 금융 데이터를 정리하여 제공하며, 투자 권유 또는 투자 자문이 아닙니다.
            모든 투자 판단과 그에 따른 결과의 책임은 투자자 본인에게 있습니다.
            본 사이트에서 제공하는 정보의 정확성, 완전성을 보장하지 않으며, 이를 기반으로 한 투자 손실에 대해 어떠한 책임도 지지 않습니다.
          </p>
          <p className="text-xs text-white leading-relaxed mb-6">
            광고 배너는 광고주가 직접 등록한 것이며, 본 사이트는 광고 내용에 대한 책임을 지지 않습니다.
            인증업체 마크는 사업자등록 확인을 의미하며, 상품의 품질이나 수익을 보증하지 않습니다.
          </p>
          <div className="text-xs text-white space-y-1">
            <p>상호명: [추후 입력] | 대표자: [추후 입력] | 사업자등록번호: [추후 입력]</p>
            <p>통신판매업 신고번호: [추후 입력] | 주소: [추후 입력]</p>
          </div>
          <div className="mt-6 pt-4 border-t border-[#077D7A] text-xs text-white text-center">
            &copy; 2026 StockTerminal. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
