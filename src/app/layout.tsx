import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Great_Vibes } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: "400",
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
      className={`${cormorant.variable} ${inter.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-charcoal">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
