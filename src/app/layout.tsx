import type { Metadata } from "next";
import localFont from "next/font/local";

import { HashRouteRedirect } from "@/components/auth/HashRouteRedirect";
import { AppToaster } from "@/components/ui/AppToaster";

import "./globals.css";

const switzer = localFont({
  src: "./fonts/switzer-variable.woff2",
  variable: "--font-switzer",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

const siteUrl = process.env.SIHEDAF_SITE_URL;
const siteDescription =
  "Wearable PPG dan AI untuk deteksi dini Atrial Fibrillation, faktor risiko utama stroke. Pantau irama jantungmu dari pergelangan tangan.";

export const metadata: Metadata = {
  // Absolute URLs for link previews; set SIHEDAF_SITE_URL in production.
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  title: "SiHEDAF",
  description: siteDescription,
  applicationName: "SiHEDAF",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "SiHEDAF",
    title: "SiHEDAF — Deteksi dini risiko stroke dengan AI",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "SiHEDAF — Deteksi dini risiko stroke dengan AI",
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${switzer.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <HashRouteRedirect />
        <AppToaster />
      </body>
    </html>
  );
}
