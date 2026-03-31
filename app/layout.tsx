import type { Metadata } from "next";
import { AppProviders } from "@/components/app-providers";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cestovatelský deník",
  description: "Publikační aplikace pro sdílení cestovatelských zážitků",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AppProviders>
          <SiteHeader />
          {children}
          <CookieConsentBanner />
        </AppProviders>
      </body>
    </html>
  );
}
