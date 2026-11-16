import { sealData } from "iron-session";
import { describe, expect, it } from "vitest";
import { hasValidAdminCookie } from "./admin-cookie";

const password = "test_password_that_is_at_least_32_chars_long";

describe("hasValidAdminCookie", () => {
  it("accepts a cookie sealed with the admin flag", async () => {
    expect(await hasValidAdminCookie(await sealData({ isAdmin: true }, { password }), password)).toBe(true);
  });

  it("rejects a forged or missing cookie", async () => {
    expect(await hasValidAdminCookie("anything", password)).toBe(false);
    expect(await hasValidAdminCookie(undefined, password)).toBe(false);
  });

  it("rejects a session without the admin flag", async () => {
    expect(await hasValidAdminCookie(await sealData({ isAdmin: false }, { password }), password)).toBe(false);
  });

  it("rejects a cookie sealed with another secret", async () => {
    const other = await sealData({ isAdmin: true }, { password: "another_password_that_is_32_chars_or_more" });
    expect(await hasValidAdminCookie(other, password)).toBe(false);
  });
});
