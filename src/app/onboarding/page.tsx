import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.onboarding === "completed") redirect("/");
  return <OnboardingWizard />;
}
