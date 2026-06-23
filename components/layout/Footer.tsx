import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0E1116]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* 브랜드 */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-lg font-bold text-white">
              Trillion <span className="text-sm font-medium text-white/45">트릴리언</span>
            </p>
            <p className="mt-2 text-sm text-white/70">흩어진 금융정보를 한눈에</p>
          </div>

          {/* 서비스 */}
          <div>
            <h4 className="mb-4 font-bold text-white">서비스</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-white/80 transition-colors hover:text-[#2DD4BF]">서비스 소개</Link></li>
            </ul>
          </div>

          {/* 약관·정책 */}
          <div>
            <h4 className="mb-4 font-bold text-white">약관·정책</h4>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-sm text-white/80 transition-colors hover:text-[#2DD4BF]">이용약관</Link></li>
              <li><Link href="/privacy" className="text-sm text-white/80 transition-colors hover:text-[#2DD4BF]">개인정보처리방침</Link></li>
            </ul>
          </div>

          {/* 문의 */}
          <div>
            <h4 className="mb-4 font-bold text-white">문의</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li>이메일: <a href="mailto:contact@onetrillion.app" className="transition-colors hover:text-[#2DD4BF]">contact@onetrillion.app</a></li>
              <li>운영시간: 평일 09:00 ~ 18:00</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-white/10 bg-[#15191F]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <p className="mb-3 text-sm leading-relaxed text-white/80">
            본 사이트는 공개된 금융 데이터·정보를 정리하여 제공하며, 투자 권유 또는 투자 자문이 아닙니다.
            모든 투자 판단과 그에 따른 결과의 책임은 이용자 본인에게 있습니다.
            본 사이트는 제공하는 정보의 정확성·완전성을 보장하지 않습니다.
          </p>
          <p className="mb-6 text-sm leading-relaxed text-white/80">
            트릴리언의 &lsquo;신고&rsquo;·평가·인증 표시는 사실 제공을 위한 것이며, 대상의 안전성·수익성을 보증하지 않습니다.
            신고되지 않은 익명 리딩방은 특히 주의하시기 바랍니다.
          </p>
          <div className="text-sm text-white/60">
            <p>상호명: 원트릴리언 | 대표자: 장은태 | 사업자등록번호: 210-39-33812 | 주소: 제주 서귀포시 동문로 55 2층</p>
          </div>
          <div className="mt-6 border-t border-white/10 pt-4 text-center text-sm text-white/70">
            &copy; 2026 Trillion. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
