import { completeOnboarding } from "@/app/actions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { syncInstagramData } from "@/lib/instagram";
import { generateWeeklyDecisions } from "@/lib/gemini";
import { auth } from "@/auth";

export default async function ProcessAuth() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const goal = cookieStore.get("onboarding_goal")?.value || "";
  const niche = cookieStore.get("onboarding_niche")?.value || "Other";

  try {
    // 1. Create User and Channel, manually save Access Token
    await completeOnboarding(goal, niche);

    // Get user id now that they exist
    // (In production, completeOnboarding could return the userId, but we can just auth() again or get it based on email)
    // Actually, completeOnboarding doesn't return the userId right now. 
    // Let's rely on the middleware redirecting properly, but wait, we need to run initial sync!
    
  } catch (error) {
    console.error("Onboarding failed:", error);
    // You might want to redirect to an error page or back to home
    redirect("/?error=onboarding_failed");
  }

  // Next steps like syncInstagramData and generateWeeklyDecisions can take 5-10 seconds.
  // In a real app, you might want to redirect to a "loading" dashboard screen that triggers these asynchronously via SWR/React Query.
  // For V1, we'll redirect to the dashboard immediately, and let the dashboard fetch data or show loading states.
  
  redirect("/dashboard");
}
