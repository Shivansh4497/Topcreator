import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from './supabase';
import { Database } from '@/types/supabase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

type Decision = {
  recommended_topic: string;
  recommended_format: Database["public"]["Enums"]["media_type_enum"];
  reasoning: string;
  hook: string;
  caption_angle: string;
  comparable_creator: string;
  comparable_engagement: string;
  risk: string;
};

type GeminiResponse = {
  decisions: Decision[];
};

export async function generateWeeklyDecisions(userId: string) {
  // 1. Fetch User and Channel Context
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('goal, niche')
    .eq('id', userId)
    .single();

  if (userError || !user) throw new Error("User not found");

  const { data: channel, error: channelError } = await supabaseAdmin
    .from('channels')
    .select('id, avg_engagement_rate, avg_saves_rate')
    .eq('user_id', userId)
    .single();

  if (channelError || !channel) throw new Error("Channel not found");

  // 2. Fetch Top Performing Posts Context
  const { data: topPosts } = await supabaseAdmin
    .from('posts')
    .select('caption, reach, engagement_rate, media_type')
    .eq('channel_id', channel.id)
    .order('engagement_rate', { ascending: false })
    .limit(3);

  const topPostsContext = topPosts?.map(p => 
    `Type: ${p.media_type}, Reach: ${p.reach}, Engagement: ${p.engagement_rate}%, Caption Snippet: ${p.caption?.slice(0, 100)}...`
  ).join('\n') || "No post history available.";

  // 3. Construct Prompt
  const prompt = `
You are an expert Instagram Strategist helping a creator grow their account.
User Goal: ${user.goal || 'Grow audience and engagement'}
Niche: ${user.niche || 'General'}
Average Engagement Rate: ${channel.avg_engagement_rate || 0}%
Average Saves Rate: ${channel.avg_saves_rate || 0}%

Here are their top performing recent posts for context:
${topPostsContext}

Based on this data, suggest EXACTLY 3 highly actionable Instagram content ideas for the upcoming week.
You must return the response as a JSON object matching this exact schema:
{
  "decisions": [
    {
      "recommended_topic": "string (The core topic)",
      "recommended_format": "REEL" | "IMAGE" | "CAROUSEL",
      "reasoning": "string (Why this works for their goal)",
      "hook": "string (The literal first 3 seconds or first text line)",
      "caption_angle": "string (How to frame the caption)",
      "comparable_creator": "string (An example of a big creator doing something similar)",
      "comparable_engagement": "string (Estimated potential engagement, e.g. '2x normal average')",
      "risk": "string (Potential downside, e.g. 'Requires high editing effort')"
    }
  ]
}
Ensure there are exactly 3 decisions. Do not include markdown formatting or backticks outside the JSON.
`;

  // 4. Call Gemini
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  const responseText = response.text;
  if (!responseText) throw new Error("Empty response from Gemini");

  let parsed: GeminiResponse;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    throw new Error("Failed to parse Gemini JSON response");
  }

  if (!parsed.decisions || !Array.isArray(parsed.decisions) || parsed.decisions.length !== 3) {
    throw new Error("Gemini returned invalid decisions format");
  }

  // 5. Save Decisions to DB
  const nextMonday = getNextMonday();
  
  const decisionsToInsert = parsed.decisions.map(d => ({
    user_id: userId,
    recommended_topic: d.recommended_topic,
    recommended_format: d.recommended_format,
    reasoning: d.reasoning,
    hook: d.hook,
    caption_angle: d.caption_angle,
    comparable_creator: d.comparable_creator,
    comparable_engagement: d.comparable_engagement,
    risk: d.risk,
    status: 'pending' as const,
    week_of: nextMonday.toISOString().split('T')[0] // YYYY-MM-DD
  }));

  const { error: insertError } = await supabaseAdmin
    .from('decisions')
    .insert(decisionsToInsert);

  if (insertError) {
    throw new Error(`Failed to insert decisions: ${insertError.message}`);
  }

  return parsed.decisions;
}

function getNextMonday() {
  const d = new Date();
  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
  return d;
}

export type TopicScoreResult = {
  score: number;
  demand_score: number;
  competition_score: number;
  trend_score: number;
  authority_score: number;
  verdict: Database["public"]["Enums"]["verdict_enum"];
  alternative_angle: string;
};

export async function scoreTopic(userId: string, topicInput: string) {
  // 1. Fetch User Context
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('goal, niche')
    .eq('id', userId)
    .single();

  if (userError || !user) throw new Error("User not found");

  // 2. Construct Prompt
  const prompt = `
You are an expert Content Strategist evaluating an Instagram post idea.
User Goal: ${user.goal || 'Grow audience and engagement'}
Niche: ${user.niche || 'General'}
Proposed Topic: "${topicInput}"

Evaluate this topic based on current Instagram trends and the user's niche.
You must return the response as a JSON object matching this exact schema:
{
  "demand_score": number (0-100, How much audience interest exists for this?),
  "competition_score": number (0-100, How saturated is this topic?),
  "trend_score": number (0-100, Is this currently trending?),
  "authority_score": number (0-100, Does this build trust and authority in the niche?),
  "verdict": "go" | "caution" | "avoid" (Overall recommendation),
  "alternative_angle": "string (A better or more unique way to frame this topic)"
}
Ensure the JSON is strictly formatted without markdown code blocks outside of the JSON.
`;

  // 3. Call Gemini
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  const responseText = response.text;
  if (!responseText) throw new Error("Empty response from Gemini");

  let parsed: Omit<TopicScoreResult, 'score'>;
  try {
    parsed = JSON.parse(responseText);
  } catch (e) {
    throw new Error("Failed to parse Gemini JSON response for topic score");
  }

  if (!parsed.verdict || !['go', 'caution', 'avoid'].includes(parsed.verdict)) {
    throw new Error("Invalid verdict returned by Gemini");
  }

  // Calculate composite score (weighted average)
  // Higher demand/trend/authority is good. Higher competition is bad, so we invert it.
  const invertedCompetition = 100 - parsed.competition_score;
  const score = Math.round(
    (parsed.demand_score * 0.3) + 
    (invertedCompetition * 0.2) + 
    (parsed.trend_score * 0.2) + 
    (parsed.authority_score * 0.3)
  );

  return {
    ...parsed,
    score
  } as TopicScoreResult;
}
