import type { SiteSettings } from "./settings";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The Discount row behind one subscriber's welcome code: single use, first order only. */
export function welcomeDiscountData(offer: SiteSettings["welcomeOffer"], code: string, now = new Date()) {
  return {
    code,
    // Shown to the shopper at checkout; the subscriber link lives on Subscriber.welcomeDiscountId.
    title: "Welcome offer",
    kind: "WELCOME" as const,
    type: "PERCENT" as const,
    percentOff: offer.percentOff,
    minSubtotalPKR: offer.minSubtotalPKR,
    minSubtotalUSD: offer.minSubtotalUSD,
    usageLimit: 1,
    perCustomerLimit: 1,
    firstOrderOnly: true,
    combinable: true,
    active: true,
    startsAt: null,
    endsAt: offer.expiryDays > 0 ? new Date(now.getTime() + offer.expiryDays * DAY_MS) : null,
  };
}
