import { completeOnboarding } from "@/app/actions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { syncInstagramData } from "@/lib/instagram";
import { auth } from "@/auth";

export default async function ProcessAuth() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const goal = cookieStore.get("onboarding_goal")?.value || "Grow my audience";
  const niche = cookieStore.get("onboarding_niche")?.value || "Other";

  let userId: string | null = null;

  try {
    // 1. Create User and Channel record, store access token
    const result = await completeOnboarding(goal, niche);
    userId = result.userId;
  } catch (error) {
    console.error("Onboarding failed:", error);
    redirect("/?error=onboarding_failed");
  }

  if (userId) {
    try {
      // 2. Run the initial Instagram data sync immediately after onboarding
      // This is the Phase 4 pipeline: resolve IG account → fetch posts → save to DB
      await syncInstagramData(userId, true);
    } catch (error: any) {
      // Sync failing shouldn't block the user from seeing the dashboard
      // They can use the Refresh button to retry
      console.error("Initial Instagram sync failed:", error.message);
    }
  }

  redirect("/dashboard");
}
