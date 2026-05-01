import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import DecisionsManager from "@/components/DecisionsManager";

export default async function DecisionsPage() {
  const session = await auth();
  if (!session || !session.user) redirect("/");

  const providerAccountId = (session as any).providerAccountId;
  const email = session.user.email || `${providerAccountId}@instagram.placeholder`;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (!user) redirect("/process-auth");

  const { data: decisions } = await supabaseAdmin
    .from("decisions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: topicScores } = await supabaseAdmin
    .from("topic_scores")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <DecisionsManager 
      decisions={decisions || []} 
      topicScores={topicScores || []} 
    />
  );
}
