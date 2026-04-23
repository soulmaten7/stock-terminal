"""
OT MARKETING 제안서 자동 생성기
────────────────────────────────────────────
사용법:
  1) 아래 INDUSTRIES 딕셔너리에서 업종 추가/수정
  2) python _generator.py 실행
  3) 같은 폴더에 01_업종.pdf ~ NN_업종.pdf 자동 생성

광고주별 맞춤 발송:
  python _generator.py --company "뉴스타트브릿지" --industry debt-relief
"""
import argparse
import datetime as dt
from pathlib import Path

from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 폰트 로딩 (한글)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FONT_DIR = Path("/sessions/admiring-modest-johnson/fonts")
pdfmetrics.registerFont(TTFont("Nanum", str(FONT_DIR / "NanumGothic.ttf")))
pdfmetrics.registerFont(TTFont("NanumBold", str(FONT_DIR / "NanumGothicBold.ttf")))

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 브랜드 색상
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BRAND = HexColor("#1E40AF")
ACCENT = HexColor("#2563EB")
LIGHT = HexColor("#F3F4F6")
MUTED = HexColor("#6B7280")
BORDER = HexColor("#E5E7EB")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 업종별 설정 (여기만 수정하면 됨)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INDUSTRIES = {
    "debt-relief": {
        "idx": "01",
        "name_kr": "개인회생·파산면책",
        "subtitle": "개인회생 CPA 파트너십 제안",
        "lead_def": [
            "1차 상담 콜 연결 완료 + 본인 확인 + 상담 진행 동의",
            "단순 번호 수집은 DB로 산정하지 않음",
            "녹취·문자 동의 로그 보관 (분쟁 대비)",
        ],
        "channels": "메타(페이스북·인스타그램) / 당근 / 네이버 / 유튜브 / 구글",
    },
    "rental-water": {
        "idx": "02",
        "name_kr": "정수기·렌탈 가전",
        "subtitle": "렌탈 리드 CPA 파트너십 제안",
        "lead_def": [
            "1차 상담 콜 연결 완료 + 설치 희망 지역·시기 확인",
            "방문 상담 예약 확정 시 DB 인정",
            "단순 번호 수집은 DB로 산정하지 않음",
        ],
        "channels": "메타(페이스북·인스타그램) / 당근 / 네이버 / 유튜브 / 구글",
    },
    "broadband": {
        "idx": "03",
        "name_kr": "인터넷·통신",
        "subtitle": "통신 3사·알뜰폰 CPA 파트너십 제안",
        "lead_def": [
            "1차 상담 콜 연결 완료 + 현재 통신사·만기일 확인",
            "상담사 연결 후 가입 의향 확인 시 DB 인정",
            "녹취·동의 로그 보관 (통신 관련 규정 준수)",
        ],
        "channels": "메타(페이스북·인스타그램) / 당근 / 네이버 / 구글",
    },
    "invest-lead": {
        "idx": "04",
        "name_kr": "주식·코인 리딩",
        "subtitle": "투자 리딩방 리드 CPA 파트너십 제안",
        "lead_def": [
            "1차 상담 콜 연결 완료 + 관심 종목·투자 경험 확인",
            "리딩방·단톡방 초대 수락 시 DB 인정",
            "투자 광고 관련 규정 준수 (금융 소비자 보호)",
        ],
        "channels": "메타(페이스북·인스타그램) / 유튜브 / 당근",
    },
    "realestate": {
        "idx": "05",
        "name_kr": "부동산·분양",
        "subtitle": "분양 관심 고객 CPA 파트너십 제안",
        "lead_def": [
            "1차 상담 콜 연결 완료 + 관심 지역·예산·입주 시기 확인",
            "모델하우스 방문 예약 또는 카탈로그 수령 동의 시 DB 인정",
            "단순 번호 수집은 DB로 산정하지 않음",
        ],
        "channels": "메타(페이스북·인스타그램) / 네이버 / 당근",
    },
    "medical": {
        "idx": "06",
        "name_kr": "병의원 (임플란트·성형·다이어트)",
        "subtitle": "의료 상담 CPA 파트너십 제안",
        "lead_def": [
            "1차 상담 콜 연결 완료 + 희망 시술·예산·선호 시기 확인",
            "내원 상담 예약 확정 시 DB 인정",
            "의료법 광고 규정 준수 (과장·유인 금지)",
        ],
        "channels": "메타(페이스북·인스타그램) / 당근 / 네이버",
    },
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 스타일
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
S = {
    "brand": ParagraphStyle("brand", fontName="NanumBold", fontSize=9,
                            textColor=MUTED, alignment=TA_LEFT, leading=12),
    "title": ParagraphStyle("title", fontName="NanumBold", fontSize=22,
                            textColor=black, alignment=TA_LEFT, leading=30),
    "subtitle": ParagraphStyle("subtitle", fontName="Nanum", fontSize=10,
                               textColor=MUTED, alignment=TA_LEFT, leading=16),
    "intro": ParagraphStyle("intro", fontName="Nanum", fontSize=10,
                            textColor=black, alignment=TA_LEFT, leading=17),
    "section": ParagraphStyle("section", fontName="NanumBold", fontSize=12,
                              textColor=white, alignment=TA_LEFT, leading=16),
    "body": ParagraphStyle("body", fontName="Nanum", fontSize=10,
                           textColor=black, alignment=TA_LEFT, leading=17),
    "sub": ParagraphStyle("sub", fontName="Nanum", fontSize=9,
                          textColor=MUTED, alignment=TA_LEFT, leading=14, leftIndent=16),
    "sign": ParagraphStyle("sign", fontName="NanumBold", fontSize=10,
                           textColor=black, alignment=TA_RIGHT, leading=16),
}


def section_header(n, title):
    t = Table(
        [[Paragraph(f"<b>{n}. {title}</b>", S["section"])]],
        colWidths=[170 * mm], rowHeights=[9 * mm],
    )
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ]))
    return t


def info_row(label, value, sub=None):
    content = f'<font color="#6B7280">{label}</font>&nbsp;&nbsp;&nbsp;<font color="#111827"><b>{value}</b></font>'
    out = [Paragraph(content, S["body"])]
    if sub:
        out.append(Paragraph(f"└ {sub}", S["sub"]))
    return out


def build_story(industry_key, company_name=None):
    cfg = INDUSTRIES[industry_key]
    story = []

    # Header
    story.append(Paragraph("OT MARKETING", S["brand"]))
    story.append(Paragraph("운영 제안서", S["title"]))
    target = f" · For {company_name}" if company_name else ""
    story.append(Paragraph(f"{cfg['subtitle']}{target}", S["subtitle"]))
    story.append(HRFlowable(width="100%", thickness=2, color=BRAND,
                            spaceBefore=0, spaceAfter=14))

    # Intro
    intro = [
        "안녕하세요, OT MARKETING 장은태입니다.",
        "앞서 보내드린 명함 잘 받으셨는지요.",
        "",
        "진행에 앞서, 저희가 운영하는 방식을 먼저 공유드립니다.",
        "이 기준으로 진행 가능하신지 확인해주시면, 이후 귀사에서 원하시는 상세 정보",
        "(랜딩페이지 문구·디자인 톤·상담 스크립트 등)를 전달받아 세팅 착수하겠습니다.",
    ]
    for line in intro:
        story.append(Paragraph(line if line else "&nbsp;", S["intro"]))
    story.append(Spacer(1, 12))

    # 1. 기본 운영 구조
    story.append(section_header("1", "기본 운영 구조"))
    story.append(Spacer(1, 6))
    story.extend(info_row("업종", cfg["name_kr"]))
    story.extend(info_row("과금", "CPA (건당 정산)"))
    story.extend(info_row("집행 매체", cfg["channels"],
                          sub="매체 승인 정책에 따라 가변 운영"))
    story.append(Spacer(1, 14))

    # 2. 리드 정의
    story.append(section_header("2", "리드 정의 (DB 인정 기준)"))
    story.append(Spacer(1, 6))
    for item in cfg["lead_def"]:
        story.append(Paragraph(f"· {item}", S["body"]))
    story.append(Spacer(1, 14))

    # 3. 랜딩페이지 구성
    story.append(section_header("3", "랜딩페이지 구성"))
    story.append(Spacer(1, 6))
    story.extend(info_row("주소", "귀사 전용 랜딩페이지 주소"))
    story.extend(info_row("구성안", "귀사 제공 자료 기준 제작 (카피·이미지·상담 프로세스)"))
    story.append(Spacer(1, 14))

    # 4. DB 수집·전달 기준
    story.append(section_header("4", "DB 수집·전달 기준"))
    story.append(Spacer(1, 6))
    story.extend(info_row("수집 채널", "제한 없음 (심사 승인 기준 내 자율 운영)"))
    story.extend(info_row("전달 방식", "구글 스프레드시트 실시간 업데이트",
                          sub="원하시면 텔레그램 즉시 알림 설정해드립니다"))
    story.extend(info_row("전달 항목", "귀사 요청 항목 기준"))
    story.append(Spacer(1, 14))

    # 5. 품질 관리
    story.append(section_header("5", "품질 관리"))
    story.append(Spacer(1, 6))
    story.extend(info_row("중복 정책", "귀사 제공 기존 DB 대조 동일 연락처 제외"))
    story.append(Spacer(1, 14))

    # 6. 정산 조건
    story.append(section_header("6", "정산 조건"))
    story.append(Spacer(1, 6))
    story.extend(info_row("건당 단가", "협의 후 결정"))
    story.extend(info_row("선입금", "협의 후 결정"))
    story.extend(info_row("정산 주기", "협의 후 결정"))
    story.append(Paragraph("· 세금계산서 발행", S["body"]))
    story.append(Spacer(1, 18))

    # 요청 자료
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER,
                            spaceBefore=4, spaceAfter=10))
    story.append(Paragraph("<b>위 운영 기준으로 진행이 가능하시다면, 다음 자료를 전달 부탁드립니다.</b>",
                           S["intro"]))
    story.append(Spacer(1, 6))

    items = [
        ("①", "서비스 소개 자료 (랜딩 원고용)"),
        ("②", "상담 스크립트 / 고객 응대 흐름"),
        ("③", "강조하고 싶은 메시지·차별점"),
        ("④", "브랜드 로고·컬러·이미지 (있으시면)"),
        ("⑤", "기존 보유 DB 리스트 (중복 필터용, 형식 무관)"),
        ("⑥", "DB 전달 시 원하시는 항목 리스트"),
    ]
    tbl = Table(
        [[Paragraph(f'<font color="#2563EB"><b>{n}</b></font>', S["body"]),
          Paragraph(t, S["body"])] for n, t in items],
        colWidths=[10 * mm, 160 * mm],
    )
    tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 12))

    story.append(Paragraph("자료 받는 대로 영업일 기준 2~3일 내 세팅 완료 후 집행 시작하겠습니다.",
                           S["intro"]))
    story.append(Spacer(1, 24))

    # 서명
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER,
                            spaceBefore=4, spaceAfter=10))
    story.append(Paragraph("감사합니다.", S["sign"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("OT MARKETING &nbsp;&nbsp; 대표 장은태 드림", S["sign"]))

    return story


def generate_pdf(industry_key, company_name=None, out_dir=None):
    cfg = INDUSTRIES[industry_key]
    out_dir = Path(out_dir or Path(__file__).parent)
    out_dir.mkdir(parents=True, exist_ok=True)

    CLEAN_NAMES = {
        "debt-relief": "개인회생",
        "rental-water": "정수기렌탈",
        "broadband": "인터넷통신",
        "invest-lead": "주식리딩",
        "realestate": "부동산분양",
        "medical": "병의원",
    }
    if company_name:
        filename = f"OT_MARKETING_운영제안서_{company_name}.pdf"
    else:
        filename = f"{cfg['idx']}_{CLEAN_NAMES[industry_key]}.pdf"

    out_path = out_dir / filename

    doc = SimpleDocTemplate(
        str(out_path), pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=20 * mm, bottomMargin=20 * mm,
        title=f"OT MARKETING 운영 제안서 - {cfg['name_kr']}",
        author="OT MARKETING",
    )
    doc.build(build_story(industry_key, company_name))
    return out_path


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CLI
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OT MARKETING 제안서 생성기")
    parser.add_argument("--industry", help="업종 키 (debt-relief / rental-water / ...)", default=None)
    parser.add_argument("--company", help="광고주 회사명 (선택)", default=None)
    parser.add_argument("--all", action="store_true", help="6종 업종 일괄 생성")
    args = parser.parse_args()

    if args.all or (not args.industry and not args.company):
        print("▶ 업종별 제안서 6종 일괄 생성 시작")
        for key in INDUSTRIES:
            path = generate_pdf(key)
            print(f"  ✓ {path.name}")
        print("▶ 완료")
    else:
        if not args.industry:
            raise SystemExit("--industry 를 지정해주세요")
        path = generate_pdf(args.industry, company_name=args.company)
        print(f"✓ 생성 완료: {path.name}")
