import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/cms/server";
import { welcomeDiscountData } from "@/lib/cms/welcome";
import { generateCode } from "@/lib/commerce/discounts";
import { sendEmail } from "@/lib/email";
import { getClientIp, isRateLimited, recordAttempt } from "@/lib/admin/rate-limit";
import { formatPKR, formatUSD } from "@/lib/format";
import { siteConfig } from "@/lib/site";

const subscribeSchema = z.object({
  email: z.email().trim().toLowerCase().max(200),
  consent: z.literal(true),
});

// Sign-ups per IP per 15 minutes; every request counts, so one visitor can't mint codes in bulk.
const MAX_SIGNUPS = 5;

function offerEmail(code: string, offer: Awaited<ReturnType<typeof getSiteSettings>>["welcomeOffer"], endsAt: Date | null) {
  const min = [
    offer.minSubtotalPKR ? formatPKR(offer.minSubtotalPKR) : null,
    offer.minSubtotalUSD ? formatUSD(offer.minSubtotalUSD) : null,
  ].filter(Boolean);
  return [
    `Welcome to ${siteConfig.name}.`,
    "",
    `Your code for ${offer.percentOff}% off your first order: ${code}`,
    "",
    "Enter it at checkout. It works once, on a first order.",
    min.length ? `Minimum order: ${min.join(" / ")}.` : "",
    endsAt ? `Valid until ${endsAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.` : "",
    "",
    `Shop: ${siteConfig.url}/products`,
  ]
    .filter((line, i, all) => line !== "" || all[i - 1] !== "")
    .join("\n");
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Sign-up isn't available right now." }, { status: 503 });
  }
  const { welcomeOffer: offer } = await getSiteSettings();
  if (!offer.enabled) {
    return NextResponse.json({ error: "This offer has ended." }, { status: 410 });
  }

  const parsed = subscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const consentMissing = parsed.error.issues.some((i) => i.path[0] === "consent");
    const error = consentMissing ? "Please tick the box to receive emails from us." : "Please enter a valid email address.";
    return NextResponse.json({ error }, { status: 400 });
  }
  const { email } = parsed.data;

  const limitKey = `subscribe:${getClientIp(request)}`;
  if (await isRateLimited(limitKey, MAX_SIGNUPS)) {
    return NextResponse.json({ error: "Too many sign-ups. Please try again later." }, { status: 429 });
  }
  await recordAttempt(limitKey, false);

  const existing = await prisma.subscriber.findUnique({ where: { email } });
  if (existing?.welcomeDiscountId) {
    // Don't reveal someone else's code on screen; send it to the inbox again.
    const discount = await prisma.discount.findUnique({ where: { id: existing.welcomeDiscountId } });
    if (discount?.active && discount.usedCount === 0 && (!discount.endsAt || discount.endsAt > new Date())) {
      await sendEmail({ to: email, subject: `Your ${siteConfig.name} welcome code`, text: offerEmail(discount.code, offer, discount.endsAt) }).catch(
        (error) => console.error("Welcome email failed", error),
      );
      return NextResponse.json({ status: "resent" });
    }
    return NextResponse.json({ status: "already-subscribed" });
  }

  const previousOrders = await prisma.order.count({
    where: { status: { not: "CANCELLED" }, email: { equals: email, mode: "insensitive" } },
  });
  if (previousOrders > 0) {
    await prisma.subscriber.upsert({ where: { email }, create: { email, consent: true }, update: {} });
    return NextResponse.json({ status: "returning-customer" });
  }

  let created: { code: string; endsAt: Date | null } | null = null;
  for (let attempt = 0; attempt < 5 && !created; attempt++) {
    const code = generateCode("WELCOME", [6]);
    try {
      created = await prisma.$transaction(async (tx) => {
        const discount = await tx.discount.create({ data: welcomeDiscountData(offer, code) });
        await tx.subscriber.upsert({
          where: { email },
          create: { email, consent: true, welcomeDiscountId: discount.id },
          update: { welcomeDiscountId: discount.id, consent: true },
        });
        return { code: discount.code, endsAt: discount.endsAt };
      });
    } catch (error) {
      // P2002: the generated code (or a concurrent sign-up for this email) collided; retry.
      if ((error as { code?: string }).code !== "P2002") throw error;
      const raced = await prisma.subscriber.findUnique({ where: { email } });
      if (raced?.welcomeDiscountId) return NextResponse.json({ status: "resent" });
    }
  }
  if (!created) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  await sendEmail({ to: email, subject: `Your ${siteConfig.name} welcome code`, text: offerEmail(created.code, offer, created.endsAt) }).catch(
    (error) => console.error("Welcome email failed", error),
  );
  return NextResponse.json({ status: "created", code: created.code });
}
