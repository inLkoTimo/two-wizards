import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // metadataBase macht aus allen relativen Angaben (Vorschaubild,
  // Canonical) vollstaendige Adressen - ohne das ignoriert Google
  // sie stillschweigend.
  metadataBase: new URL(siteUrl),
  title: siteName,
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName,
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

// viewportFit: "cover" sorgt dafür, dass das Layout auf iPhones bis
// an den Rand geht; die sichere Zone berücksichtigt das Spiel selbst.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#05080d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
