import type { Metadata } from "next";
import { InterviewVideo } from "../components/InterviewFunnelExperience";

export const metadata: Metadata = {
  title: "Property Strategy Video Report | Baxter & Mason",
  description: "Watch Sally Blyth's property strategy report and arrange a free discovery call.",
  alternates: { canonical: "/video-page-2417-2491" },
};

export default function SpecialVideoReportPage() {
  return <InterviewVideo compact />;
}
