import type { Metadata } from "next";
import { InterviewLanding } from "../components/InterviewFunnelExperience";

export const metadata: Metadata = {
  openGraph: { images: [{ url: "https://www.baxtermason.com.au/brand/social-logo-20261108.png", width: 1200, height: 630, type: "image/png", alt: "Baxter & Mason logo" }] },
  twitter: { card: "summary_large_image", images: [{ url: "https://www.baxtermason.com.au/brand/social-logo-20261108.png", width: 1200, height: 630, type: "image/png", alt: "Baxter & Mason logo" }] },
  title: "Free Property-Buying Video Report | Baxter & Mason",
  description: "Discover the three mistakes that keep buyers searching and missing out on their dream home.",
  alternates: { canonical: "/interview-funnel" },
};

export default function InterviewFunnelPage() {
  return <InterviewLanding />;
}
