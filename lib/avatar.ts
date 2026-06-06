// 종목 레터 아바타 — 무료 로고 소스 없는 국내 종목용. 첫 글자 + 이름 해시 파스텔색.
const PALETTE = [
  "#FEE2E2", "#FEF3C7", "#D1FAE5", "#DBEAFE",
  "#EDE9FE", "#FCE7F3", "#E0F2FE", "#FEF9C3",
  "#FFE4E6", "#ECFCCB",
];

export function avatarBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function avatarChar(name: string): string {
  const t = (name || "").trim();
  return t ? t.charAt(0).toUpperCase() : "?";
}
