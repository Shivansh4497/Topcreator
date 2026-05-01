"use server";

import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Database } from "@/types/supabase";

type NicheEnum = Database["public"]["Enums"]["niche_enum"];

export async function completeOnboarding(goal: string, nicheInput: string) {
  const session = await auth();
  if (!session || !session.user || !session.accessToken) {
    throw new Error("Not authenticated");
  }

  const niche = nicheInput as NicheEnum;

  // We use Facebook providerAccountId as the instagram_user_id placeholder for now
  // In a real flow, we would use the Graph API to get the actual linked IG account ID
  const providerAccountId = session.providerAccountId;
  const accessToken = session.accessToken;
  const email = session.user.email || `${providerAccountId}@instagram.placeholder`;

  // 1. Create or get user
  let { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (!user) {
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        email,
        goal,
        niche,
      })
      .select("id")
      .single();

    if (insertError) throw new Error(insertError.message);
    user = newUser;
  } else {
    // Update goal and niche if they exist
    await supabaseAdmin
      .from("users")
      .update({ goal, niche })
      .eq("id", user.id);
  }

  // 2. Upsert Channel with Access Token
  const { error: channelError } = await supabaseAdmin
    .from("channels")
    .upsert({
      user_id: user.id,
      instagram_user_id: providerAccountId, // We will replace this with actual IG ID via Graph API later
      access_token: accessToken,
    }, { onConflict: 'user_id' });

  if (channelError) {
    throw new Error(channelError.message);
  }

  return { success: true, userId: user!.id };
}

export async function saveSelectedInstagramAccount(
  igId: string,
  igUsername: string,
  igFollowers: number,
  pageAccessToken: string
) {
  const session = await auth();
  if (!session || !session.user) throw new Error("Not authenticated");

  const providerAccountId = (session as any).providerAccountId;
  const email = session.user.email || `${providerAccountId}@instagram.placeholder`;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (!user) throw new Error("User not found");

  const { error: updateError } = await supabaseAdmin
    .from("channels")
    .update({
      instagram_user_id: igId,
      username: igUsername,
      follower_count: igFollowers,
      access_token: pageAccessToken,
    })
    .eq("user_id", user.id);

  if (updateError) throw new Error(updateError.message);

  try {
    const { syncInstagramData } = await import("@/lib/instagram");
    await syncInstagramData(user.id, true);
  } catch (err: any) {
    console.error("[saveSelectedInstagramAccount] Sync error:", err.message);
  }
}

import { scoreTopic } from "@/lib/gemini";

export async function processTopic(topicInput: string) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Not authenticated");
  }

  const providerAccountId = (session as any).providerAccountId;
  const email = session.user.email || `${providerAccountId}@instagram.placeholder`;

  // Get user ID
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (userError || !user) throw new Error("User not found");

  // Call Gemini API wrapper
  const result = await scoreTopic(user.id, topicInput);

  // Save to DB
  const { error: insertError } = await supabaseAdmin
    .from("topic_scores")
    .insert({
      user_id: user.id,
      topic_input: topicInput,
      score: result.score,
      demand_score: result.demand_score,
      competition_score: result.competition_score,
      trend_score: result.trend_score,
      authority_score: result.authority_score,
      verdict: result.verdict,
      alternative_angle: result.alternative_angle,
    });

  if (insertError) throw new Error(`Failed to save topic score: ${insertError.message}`);

  return result;
}

import { syncInstagramData } from "@/lib/instagram";
import { revalidatePath } from "next/cache";

export async function refreshData(formData?: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Not authenticated");
  }

  const providerAccountId = (session as any).providerAccountId;
  const email = session.user.email || `${providerAccountId}@instagram.placeholder`;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (!user) throw new Error("User not found");

  await syncInstagramData(user.id, true);
  
  revalidatePath("/dashboard");
}

import { generateWeeklyDecisions } from "@/lib/gemini";

export async function triggerWeeklyStrategy() {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Not authenticated");
  }

  const providerAccountId = (session as any).providerAccountId;
  const email = session.user.email || `${providerAccountId}@instagram.placeholder`;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (!user) throw new Error("User not found");

  await generateWeeklyDecisions(user.id);
  
  revalidatePath("/dashboard/decisions");
  return { success: true };
}
