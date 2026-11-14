import { NextResponse } from "next/server";
import { inquirySchema } from "@/lib/inquiry-schema";
import { siteConfig } from "@/lib/site";
import { sendEmail } from "@/lib/email";

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

    await sendEmail({
      to: siteConfig.contactEmail,
      replyTo: data.email,
      subject: `New Inquiry from ${data.name}`,
      text: emailBody,
    });

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
