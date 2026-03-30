import type { Metadata } from "next";
import { AppProviders } from "@/components/app-providers";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cestovatelsky denik",
  description: "Publikacni aplikace pro sdileni cestovatelskych zazitku",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body>
        <AppProviders>
          <SiteHeader />
          {children}
          <CookieConsentBanner />
        </AppProviders>
      </body>
    </html>
  );
}
