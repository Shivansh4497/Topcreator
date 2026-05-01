import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import DecisionsManager from "@/components/DecisionsManager";

export default async function DecisionsPage() {
  const session = await auth();
  if (!session || !session.user || !session.user.email) redirect("/");

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) redirect("/");

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
