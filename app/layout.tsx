import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Thaana } from "next/font/google";
import { getLocale } from "@/lib/i18n/server";
import { localeDir } from "@/lib/i18n/dictionaries";
import "./globals.css";

const latin = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

const thaana = Noto_Sans_Thaana({
  subsets: ["thaana"],
  variable: "--font-thaana",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://avasthaa.mv"),
  title: {
    default: "Avas Thaa — Tha Atoll Delivery",
    template: "%s · Avas Thaa",
  },
  description:
    "Avas Thaa connects Tha Atoll customers with restaurants, shops, and delivery partners across every island.",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Avas Thaa",
    description: "Local delivery and ordering for Tha Atoll, Maldives.",
    locale: "en_MV",
    type: "website",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a2038",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

// lang/dir come from the persisted locale cookie so the very first
// server-rendered paint is already correct — no client-side flash of
// the wrong direction while a script flips documentElement afterwards.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale();
  const dir = localeDir[locale];

  return (
    <html lang={locale} dir={dir} className={`${latin.variable} ${thaana.variable}`}>
      <body className={dir === "rtl" ? "font-thaana" : "font-latin"}>{children}</body>
    </html>
  );
}
