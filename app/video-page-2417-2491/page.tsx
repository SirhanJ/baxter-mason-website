import type { Metadata } from "next";
import { InterviewVideo } from "../components/InterviewFunnelExperience";

export const metadata: Metadata = {
  openGraph: { images: ["https://www.baxtermason.com.au/images/66f243dc0b3af8e3d2500f2d.jpeg"] },
  twitter: { card: "summary_large_image", images: ["https://www.baxtermason.com.au/images/66f243dc0b3af8e3d2500f2d.jpeg"] },
  title: "43-Minute Property-Buying Video Report | Baxter & Mason",
  description: "Watch Sally Blyth's private property-buying case study and book a discovery call.",
  alternates: { canonical: "/video-page-2417-2491" },
};

export default function InterviewVideoPage() {
  return <InterviewVideo />;
}
