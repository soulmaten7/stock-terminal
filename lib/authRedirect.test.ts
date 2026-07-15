import { describe, it, expect } from "vitest";
import { safeNextPath, localizePath } from "./authRedirect";

describe("safeNextPath — 오픈 리다이렉트 가드", () => {
  it("내부 절대경로는 통과", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("/mypage")).toBe("/mypage");
  });
  it("null/undefined는 /", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath(undefined)).toBe("/");
  });
  it("프로토콜-상대(//)·외부 URL·상대경로는 / 로 차단", () => {
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("evil")).toBe("/");
  });
});

describe("localizePath — as-needed 로케일 프리픽스", () => {
  it("en: 루트는 /en, 그 외는 /en 접두", () => {
    expect(localizePath("/", "en")).toBe("/en");
    expect(localizePath("/admin", "en")).toBe("/en/admin");
    expect(localizePath("/auth/login?error=no_code", "en")).toBe("/en/auth/login?error=no_code");
  });
  it("en: 이미 /en 프리픽스면 중복 안 붙임", () => {
    expect(localizePath("/en", "en")).toBe("/en");
    expect(localizePath("/en/admin", "en")).toBe("/en/admin");
  });
  it("ko: 프리픽스 없음(그대로)", () => {
    expect(localizePath("/", "ko")).toBe("/");
    expect(localizePath("/admin", "ko")).toBe("/admin");
  });
});
