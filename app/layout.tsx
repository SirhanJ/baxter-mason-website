import type { Metadata } from "next";
import { SITE } from "./lib/seo";

export const metadata: Metadata = {
  // Lets every page declare relative og:image paths and still emit absolute URLs.
  metadataBase: new URL(SITE),
  title: "Baxter & Mason",
  description: "Sunshine Coast buyers agent",
  alternates: { canonical: "/" },
  openGraph: { siteName: "Baxter & Mason", locale: "en_AU", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..500&family=Hanken+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          type="image/png"
          href="/images/logos%20and%20sally%20stuff/Baxter-and-Mason-favicon-orange.png"
        />
        <link rel="preconnect" href="https://app.vexur.com.au" />
        <link rel="stylesheet" href="/css/styles.css?v=59" />
      </head>
      <body>{children}</body>
    </html>
  );
}
