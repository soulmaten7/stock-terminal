import { BANNED_WORDS } from '@/lib/constants/bannedWords';

const URL_PATTERN = /https?:\/\/|www\./i;

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
}

export function checkMessage(content: string): ModerationResult {
  // 금칙어 체크
  const found = BANNED_WORDS.find((word) => content.includes(word));
  if (found) {
    return { allowed: false, reason: '해당 표현은 사용할 수 없습니다' };
  }

  // 외부 링크 체크
  if (URL_PATTERN.test(content)) {
    return { allowed: false, reason: '외부 링크는 입력할 수 없습니다' };
  }

  return { allowed: true };
}

export function checkBannerContent(text: string): { valid: boolean; foundWords: string[] } {
  const foundWords = BANNED_WORDS.filter((word) => text.includes(word));
  return { valid: foundWords.length === 0, foundWords };
}
