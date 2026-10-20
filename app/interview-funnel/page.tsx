import type { Metadata } from "next";
import { InterviewLanding } from "../components/InterviewFunnelExperience";

export const metadata: Metadata = {
  openGraph: { images: ["https://www.baxtermason.com.au/images/66f243dc0b3af8e3d2500f2d.jpeg"] },
  twitter: { card: "summary_large_image", images: ["https://www.baxtermason.com.au/images/66f243dc0b3af8e3d2500f2d.jpeg"] },
  title: "Free Property-Buying Video Report | Baxter & Mason",
  description: "Discover the three mistakes that keep buyers searching and missing out on their dream home.",
  alternates: { canonical: "/interview-funnel" },
};

export default function InterviewFunnelPage() {
  return <InterviewLanding />;
}
