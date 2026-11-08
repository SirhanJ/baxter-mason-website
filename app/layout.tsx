import type { Metadata } from "next";
import Script from "next/script";
import { SITE } from "./lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  // Lets every page declare relative og:image paths and still emit absolute URLs.
  metadataBase: new URL(SITE),
  title: "Baxter & Mason",
  description: "Sunshine Coast buyers agent",
  alternates: { canonical: "/" },
  openGraph: { siteName: "Baxter & Mason", locale: "en_AU", type: "website", images: [{ url: "https://www.baxtermason.com.au/brand/social-logo-20261108.png", width: 1200, height: 630, type: "image/png", alt: "Baxter & Mason logo" }] },
  twitter: { card: "summary_large_image", images: [{ url: "https://www.baxtermason.com.au/brand/social-logo-20261108.png", width: 1200, height: 630, type: "image/png", alt: "Baxter & Mason logo" }] },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU">
      <head>


        <link rel="stylesheet" href="/fonts/site-fonts-v2.css" />
        <link
          rel="icon"
          type="image/png"
          href="/images/logos%20and%20sally%20stuff/Baxter-and-Mason-favicon-orange.png"
        />
        <link rel="preconnect" href="https://app.vexur.com.au" />
        <link rel="stylesheet" href="/css/styles.css?v=20261106" />
      </head>
      <body>{children}<Script src="https://app.vexur.com.au/sdk/chatbot-widget.js" data-widget-id="15d121be-084e-4a88-b0a3-5eacb35ae70c" strategy="afterInteractive" />  <script async src="https://t.vexur.com.au/v1.js" data-site="baxter-mason-property-buyers-agent" />
      </body>
    </html>
  );
}
