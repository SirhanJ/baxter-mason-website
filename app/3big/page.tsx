import type { Metadata } from "next";
import { InterviewLanding } from "../components/InterviewFunnelExperience";

export const metadata: Metadata = {
  title: "The 3 Deadly Property-Buying Mistakes | Baxter & Mason",
  description: "Claim Sally Blyth's free property-buying video report.",
  alternates: { canonical: "/interview-funnel" },
};

export default function ThreeBigMistakesPage() {
  return <InterviewLanding />;
}
