import type { Metadata } from "next";
import { InterviewVideo } from "../components/InterviewFunnelExperience";

export const metadata: Metadata = {
  openGraph: { images: [{ url: "https://www.baxtermason.com.au/brand/social-logo-20261108.png", width: 1200, height: 630, type: "image/png", alt: "Baxter & Mason logo" }] },
  twitter: { card: "summary_large_image", images: [{ url: "https://www.baxtermason.com.au/brand/social-logo-20261108.png", width: 1200, height: 630, type: "image/png", alt: "Baxter & Mason logo" }] },
  title: "43-Minute Property-Buying Video Report | Baxter & Mason",
  description: "Watch Sally Blyth's private property-buying case study and book a discovery call.",
  alternates: { canonical: "/video-page-2417-2491" },
};

export default function InterviewVideoPage() {
  return <InterviewVideo />;
}
