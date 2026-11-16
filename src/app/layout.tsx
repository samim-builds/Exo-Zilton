import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import "./globals.css";

// Fraunces for display type (soft optical-size serif), Instrument Sans for UI and body.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} — Premium Mortar & Pestle`,
  description: siteConfig.description,
  keywords: [
    "porcelain mortar and pestle",
    "unglazed vitrified porcelain grinder",
    "beechwood handle mortar pestle",
    "premium mortar pestle Pakistan",
    "Exo Zilton",
  ],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrumentSans.variable} h-full antialiased`}
    >
      {/* Browser extensions (e.g. Grammarly) inject attributes on <body> before hydration.
          This only silences attribute mismatches on <body> itself, not its children. */}
      <body className="flex min-h-full flex-col bg-porcelain text-ink" suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
