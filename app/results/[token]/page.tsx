import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResultView } from "@/src/components/result-view";
import { loadAttempt } from "@/src/lib/attempt-report";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your personalised result | Absolute Mind",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function SavedResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();
  const attempt = await loadAttempt({ publicToken: token }).catch((error) => {
    console.error("Could not load saved result", error);
    return null;
  });
  if (!attempt) notFound();
  const emailStatus = attempt.emailStatus === "SENT" ? "sent" : attempt.emailStatus === "FAILED" ? "failed" : "not-configured";
  return <ResultView assessment={attempt.assessment} participant={attempt.participant} report={attempt.report} delivery={{ emailStatus }} isSavedLink />;
}
