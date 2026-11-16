import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { SmoothScroll } from "@/components/shared/SmoothScroll";
import { WhatsAppButton } from "@/components/shared/WhatsAppButton";
import { WelcomeOffer } from "@/components/shared/WelcomeOffer";
import { CartProvider } from "@/components/cart/CartProvider";
import { getSiteSettings } from "@/lib/cms/server";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  return (
    <CartProvider>
      <SmoothScroll>
        <AnnouncementBar announcement={settings.announcement} />
        <Header contact={settings.contact} links={settings.navigation.header} />
        <main className="flex-1">{children}</main>
        <Footer contact={settings.contact} links={settings.navigation.footer} />
        <WhatsAppButton />
        <WelcomeOffer offer={settings.welcomeOffer} />
      </SmoothScroll>
    </CartProvider>
  );
}
