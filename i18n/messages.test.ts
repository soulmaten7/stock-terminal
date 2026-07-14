import { describe, expect, it } from 'vitest';
import { createTranslator } from 'use-intl/core';
import ko from '../messages/ko.json';
import en from '../messages/en.json';
import { routing } from './routing';

// 로케일 메시지 안전망.
// 새 로케일을 붙일 때 여기서 막힌다: 키 누락(→ MISSING_MESSAGE), 죽은 키,
// 플레이스홀더/리치태그 유실, ICU 렌더 실패(영어 아포스트로피 '가 escape 문자로 먹히는 함정).

type Tree = { [k: string]: string | Tree };

const flatten = (o: Tree, prefix = '', acc: Record<string, string> = {}) => {
  for (const [k, v] of Object.entries(o)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') acc[key] = v;
    else flatten(v, key, acc);
  }
  return acc;
};

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const tags = (s: string) => [...s.matchAll(/<(\w+)>/g)].map((m) => m[1]).sort();

const CATALOGS: Record<string, Tree> = { ko: ko as Tree, en: en as Tree };
const FLAT = Object.fromEntries(Object.entries(CATALOGS).map(([l, m]) => [l, flatten(m)]));
const BASE = 'ko';

describe('messages', () => {
  it('routing.locales와 messages/*.json이 1:1로 맞는다', () => {
    expect([...routing.locales].sort()).toEqual(Object.keys(CATALOGS).sort());
  });

  for (const locale of Object.keys(CATALOGS).filter((l) => l !== BASE)) {
    describe(`${locale} vs ${BASE}`, () => {
      const base = FLAT[BASE];
      const target = FLAT[locale];

      it('키 집합이 완전히 동일하다 (누락 0 · 초과 0)', () => {
        const missing = Object.keys(base).filter((k) => !(k in target));
        const extra = Object.keys(target).filter((k) => !(k in base));
        expect({ missing, extra }).toEqual({ missing: [], extra: [] });
      });

      it('값이 비어있지 않다', () => {
        expect(Object.keys(target).filter((k) => target[k].trim() === '')).toEqual([]);
      });

      it('플레이스홀더·리치태그가 보존된다', () => {
        const mismatched = Object.keys(base)
          .filter((k) => k in target)
          .filter(
            (k) =>
              placeholders(base[k]).join() !== placeholders(target[k]).join() ||
              tags(base[k]).join() !== tags(target[k]).join(),
          );
        expect(mismatched).toEqual([]);
      });
    });
  }

  for (const locale of Object.keys(CATALOGS)) {
    it(`${locale}: 모든 메시지가 ICU 에러 없이 렌더된다`, () => {
      const errors: string[] = [];
      const t = createTranslator({
        locale,
        messages: CATALOGS[locale],
        onError: (e) => errors.push(`${e.code}: ${e.message}`),
      });
      const raw: string[] = [];

      for (const [key, message] of Object.entries(FLAT[locale])) {
        const values: Record<string, unknown> = {};
        for (const name of placeholders(message)) values[name] = 7;
        for (const tag of new Set(tags(message))) values[tag] = (chunks: unknown) => `[${chunks}]`;

        const out = t.rich(key as never, values as never);
        const text = Array.isArray(out) ? out.join('') : String(out);
        // 미치환 플레이스홀더({n})나 살아남은 원본 태그(<b>)가 화면에 그대로 나오면 실패
        if (/\{\w/.test(text) || /<\w/.test(text)) raw.push(`${key} => ${text}`);
      }

      expect({ errors, raw }).toEqual({ errors: [], raw: [] });
    });
  }

  // ICU에서 '는 escape 문자다. 영어 축약형(don't·we'll)을 그대로 넣으면 렌더가 깨진다.
  // 전략 = 축약형을 아예 쓰지 않는다.
  it('en: 축약형 아포스트로피를 쓰지 않는다', () => {
    expect(Object.keys(FLAT.en).filter((k) => FLAT.en[k].includes("'"))).toEqual([]);
  });

  // 브랜드 보이스 잠금 — 마케팅 카피로 흘러가지 않게 못 박는다.
  it('en: 브랜드 보이스 잠금 문자열이 유지된다', () => {
    const locked: Record<string, string> = {
      'About.slogan': 'An eye for stocks — for everyone.',
      'About.sub': 'Every lens, as data — the judgment is yours.',
      'About.quote': '“The best thing a human being can do is to help another human being know more.”',
      'About.pillar.armT': 'Institutional-grade analysis',
      'About.pillar.seeT': 'Honest data',
      'About.pillar.ownT': 'Your judgment',
      // 로고 락업(Trillion + 트릴리언)의 한글 워드마크. 번역 대상이 아니라 로고 요소라
      // en에서도 그대로 둔다 — 번역하면 헤더와 달리 "Trillion Trillion"이 된다.
      'Login.brandKo': '트릴리언',
      'LensPreview.lensTitle': 'TR-AI Lens',
      'LensPreview.notAi': 'Not AI analysis',
      'LensPreview.material': 'Not a buy or sell signal — material for you to judge for yourself.',
      'StockLens.horizon.title': 'At a glance, over time',
      'StockLens.events.recentFilings': 'Recent material filings',
    };
    expect(Object.fromEntries(Object.keys(locked).map((k) => [k, FLAT.en[k]]))).toEqual(locked);
  });
});
