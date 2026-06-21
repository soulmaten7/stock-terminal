import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#088F8C] bg-[#0ABAB5]">
      {/* Main */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* 브랜드 */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-lg font-bold text-white">
              UNJONG <span className="text-sm font-medium">운종</span>
            </p>
            <p className="mt-2 text-sm text-white/90">투자상품에 속지 않게 돕는 곳</p>
          </div>

          {/* 서비스 */}
          <div>
            <h4 className="mb-4 font-bold text-white">서비스</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-white transition-colors hover:text-[#C9A96E]">
                  서비스 소개
                </Link>
              </li>
            </ul>
          </div>

          {/* 약관·정책 */}
          <div>
            <h4 className="mb-4 font-bold text-white">약관·정책</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-white transition-colors hover:text-[#C9A96E]">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-white transition-colors hover:text-[#C9A96E]">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>

          {/* 문의 */}
          <div>
            <h4 className="mb-4 font-bold text-white">문의</h4>
            <ul className="space-y-2 text-sm text-white">
              <li>카카오톡: @운종</li>
              <li>이메일: 도메인 확정 후 안내</li>
              <li>운영시간: 평일 09:00 ~ 18:00</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-[#088F8C] bg-[#088F8C]">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <p className="mb-3 text-sm leading-relaxed text-white">
            본 사이트는 공개된 금융 데이터·정보를 정리하여 제공하며, 투자 권유 또는 투자 자문이 아닙니다.
            모든 투자 판단과 그에 따른 결과의 책임은 이용자 본인에게 있습니다.
            본 사이트는 제공하는 정보의 정확성·완전성을 보장하지 않습니다.
          </p>
          <p className="mb-6 text-sm leading-relaxed text-white">
            운종의 &lsquo;신고&rsquo;·평가·인증 표시는 사실 제공을 위한 것이며, 대상의 안전성·수익성을 보증하지 않습니다.
            신고되지 않은 익명 리딩방은 특히 주의하시기 바랍니다.
          </p>
          <div className="text-sm text-white/90">
            <p>상호명: [추후 입력] | 대표자: [추후 입력] | 사업자등록번호: [추후 입력] | 주소: [추후 입력]</p>
          </div>
          <div className="mt-6 border-t border-[#077D7A] pt-4 text-center text-sm text-white">
            &copy; 2026 운종. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
