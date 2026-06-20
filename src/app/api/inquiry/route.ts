import { NextResponse } from "next/server";
import { inquirySchema } from "@/lib/inquiry-schema";
import { siteConfig } from "@/lib/site";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = inquirySchema.parse(body);

    const emailBody = [
      `New inquiry from ${siteConfig.name} website`,
      "",
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Phone: ${data.phone}`,
      `Country: ${data.country}`,
      data.product ? `Product: ${data.product}` : "",
      data.size ? `Size: ${data.size}` : "",
      `Quantity: ${data.quantity}`,
      "",
      `Message:`,
      data.message,
    ]
      .filter(Boolean)
      .join("\n");

    if (process.env.RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM ?? "Exo Zilton <onboarding@resend.dev>",
          to: [siteConfig.contactEmail],
          reply_to: data.email,
          subject: `New Inquiry from ${data.name}`,
          text: emailBody,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }
    } else {
      console.log("[Inquiry received]", emailBody);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    console.error("[Inquiry error]", error);
    return NextResponse.json(
      { error: "Failed to send inquiry. Please try WhatsApp instead." },
      { status: 500 },
    );
  }
}
