import type { Metadata } from "next";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
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
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
