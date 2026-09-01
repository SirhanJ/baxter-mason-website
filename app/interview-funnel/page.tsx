import type { Metadata } from "next";
import { InterviewLanding } from "../components/InterviewFunnelExperience";

export const metadata: Metadata = {
  title: "Free Property-Buying Video Report | Baxter & Mason",
  description: "Discover the three mistakes that keep buyers searching and missing out on their dream home.",
  alternates: { canonical: "/interview-funnel" },
};

export default function InterviewFunnelPage() {
  return <InterviewLanding />;
}
