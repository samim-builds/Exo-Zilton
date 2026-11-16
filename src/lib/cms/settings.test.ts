import { describe, expect, it } from "vitest";
import { SETTING_DEFAULTS, resolveSettings, settingsTokens } from "./settings";
import { welcomeDiscountData } from "./welcome";

describe("resolveSettings", () => {
  it("falls back to defaults when nothing is stored", () => {
    expect(resolveSettings([])).toEqual(SETTING_DEFAULTS);
  });

  it("merges a stored group over the defaults", () => {
    const s = resolveSettings([{ key: "contact", value: { contactEmail: "shop@example.com" } }]);
    expect(s.contact.contactEmail).toBe("shop@example.com");
    expect(s.contact.siteName).toBe(SETTING_DEFAULTS.contact.siteName);
  });

  it("ignores a stored group that fails validation", () => {
    const s = resolveSettings([{ key: "welcomeOffer", value: { percentOff: 500 } }]);
    expect(s.welcomeOffer).toEqual(SETTING_DEFAULTS.welcomeOffer);
  });

  it("ignores unknown keys", () => {
    expect(resolveSettings([{ key: "nope", value: { a: 1 } }])).toEqual(SETTING_DEFAULTS);
  });
});

describe("settingsTokens", () => {
  it("exposes contact values for {{token}} interpolation", () => {
    const t = settingsTokens(SETTING_DEFAULTS);
    expect(t.siteName).toBe(SETTING_DEFAULTS.contact.siteName);
    expect(t.contactEmail).toBe(SETTING_DEFAULTS.contact.contactEmail);
    expect(t.foundingYear).toBe(SETTING_DEFAULTS.contact.foundingYear);
  });
});

describe("welcomeDiscountData", () => {
  const now = new Date("2026-11-16T10:00:00Z");
  const offer = { ...SETTING_DEFAULTS.welcomeOffer, percentOff: 15, expiryDays: 30, minSubtotalPKR: 5000, minSubtotalUSD: null };

  it("creates a single-use, first-order percent code that expires after the configured days", () => {
    const d = welcomeDiscountData(offer, "WELCOME-ABC234", now);
    expect(d).toMatchObject({
      code: "WELCOME-ABC234",
      kind: "WELCOME",
      type: "PERCENT",
      percentOff: 15,
      usageLimit: 1,
      perCustomerLimit: 1,
      firstOrderOnly: true,
      minSubtotalPKR: 5000,
      minSubtotalUSD: null,
      active: true,
    });
    expect(d.endsAt).toEqual(new Date("2026-12-16T10:00:00Z"));
    // The title reaches the shopper in checkout quotes, so it must not carry the subscriber email.
    expect(d.title).not.toContain("a@b.c");
    expect(d.title).toBe("Welcome offer");
  });

  it("leaves the code open-ended when expiryDays is 0", () => {
    expect(welcomeDiscountData({ ...offer, expiryDays: 0 }, "WELCOME-X", now).endsAt).toBeNull();
  });
});
