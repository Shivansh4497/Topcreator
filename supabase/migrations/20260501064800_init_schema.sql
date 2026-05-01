-- Enums
CREATE TYPE niche_enum AS ENUM ('Education', 'Finance', 'Technology', 'Lifestyle', 'Fitness', 'Other');
CREATE TYPE media_type_enum AS ENUM ('REEL', 'IMAGE', 'CAROUSEL');
CREATE TYPE comment_sentiment_enum AS ENUM ('positive', 'negative', 'mixed');
CREATE TYPE decision_status_enum AS ENUM ('pending', 'made_it', 'skipped');
CREATE TYPE verdict_enum AS ENUM ('go', 'caution', 'avoid');

-- Users Table
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  goal text,
  niche niche_enum,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Channels Table
CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  instagram_user_id text,
  username text,
  follower_count integer,
  avg_engagement_rate double precision,
  avg_saves_rate double precision,
  fetched_at timestamp with time zone,
  access_token text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id) -- Assuming 1 channel per user for V1
);

-- Posts Table
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE,
  instagram_media_id text,
  media_type media_type_enum,
  caption text,
  hashtags text[],
  reach integer,
  impressions integer,
  engagement_rate double precision,
  saves integer,
  saves_rate double precision,
  shares integer,
  comments_count integer,
  plays integer,
  comment_top_theme text,
  comment_sentiment comment_sentiment_enum,
  published_at timestamp with time zone,
  fetched_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(instagram_media_id)
);

-- Decisions Table
CREATE TABLE public.decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  recommended_topic text,
  recommended_format media_type_enum,
  reasoning text,
  hook text,
  caption_angle text,
  comparable_creator text,
  comparable_engagement text,
  risk text,
  status decision_status_enum DEFAULT 'pending',
  week_of date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Topic Scores Table
CREATE TABLE public.topic_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  topic_input text,
  score integer,
  demand_score integer,
  competition_score integer,
  trend_score integer,
  authority_score integer,
  verdict verdict_enum,
  alternative_angle text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_scores ENABLE ROW LEVEL SECURITY;

-- Create policies so users can only view and edit their own data
-- For V1 we assume the app logic handles authentication and row creation securely
-- But we can enforce basic RLS based on auth.uid() if using Supabase Auth (though we use NextAuth, 
-- we will just setup basic skeleton RLS or skip strict enforcing if purely server-side)
-- Note: Since we use NextAuth and access the DB mostly via service role / admin in Next.js Server Components, 
-- we can keep RLS enabled but skip adding strict policies for now, meaning ONLY server-side service role can read/write.
