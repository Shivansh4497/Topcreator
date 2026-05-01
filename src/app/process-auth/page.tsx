import { completeOnboarding } from "@/app/actions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ProcessAuth() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const goal = cookieStore.get("onboarding_goal")?.value || "Grow my audience";
  const niche = cookieStore.get("onboarding_niche")?.value || "Other";

  try {
    // Save User + Channel with access token — DO NOT sync yet.
    // The user needs to select their Instagram account first.
    await completeOnboarding(goal, niche);
  } catch (error) {
    console.error("Onboarding failed:", error);
    redirect("/?error=onboarding_failed");
  }

  // Redirect to account selection step
  redirect("/select-account");
}
