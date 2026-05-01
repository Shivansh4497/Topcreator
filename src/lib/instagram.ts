import { supabaseAdmin } from './supabase';

const GRAPH_API_VERSION = 'v18.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// ─────────────────────────────────────────────
// Step 1: Get Facebook Pages for this user
// ─────────────────────────────────────────────
async function getFacebookPages(accessToken: string) {
  const res = await fetch(
    `${BASE_URL}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
  );
  const data = await res.json();

  if (data.error) {
    throw new Error(`Facebook Pages API error: ${data.error.message}`);
  }

  return data.data as { id: string; name: string; access_token: string }[];
}

// ─────────────────────────────────────────────
// Step 2: Get Instagram Business Account from a Page
// ─────────────────────────────────────────────
async function getInstagramBusinessAccountFromPage(
  pageId: string,
  pageAccessToken: string
) {
  const res = await fetch(
    `${BASE_URL}/${pageId}?fields=instagram_business_account{id,username,followers_count,biography,profile_picture_url}&access_token=${pageAccessToken}`
  );
  const data = await res.json();

  if (data.error) {
    throw new Error(`Page IG lookup error: ${data.error.message}`);
  }

  return data.instagram_business_account || null;
}

// ─────────────────────────────────────────────
// Step 3: Get recent media + insights
// ─────────────────────────────────────────────
async function fetchRecentMedia(
  igAccountId: string,
  accessToken: string,
  limit = 25
) {
  // Insights fields: reach, saved (saves), impressions
  // Note: insights are only available for business/creator accounts
  const mediaFields = 'id,media_type,caption,comments_count,like_count,timestamp';
  
  const res = await fetch(
    `${BASE_URL}/${igAccountId}/media?fields=${mediaFields}&access_token=${accessToken}&limit=${limit}`
  );
  const data = await res.json();

  if (data.error) {
    throw new Error(`Media fetch error: ${data.error.message}`);
  }

  return (data.data || []) as any[];
}

// Fetch insights for a single media object (reach, saved, impressions)
async function fetchMediaInsights(
  mediaId: string,
  mediaType: string,
  accessToken: string
): Promise<{ reach: number; saved: number; impressions: number }> {
  // VIDEO (REELS) uses different metrics than IMAGE/CAROUSEL
  let metrics = 'reach,saved,impressions';
  if (mediaType === 'VIDEO') {
    // Reels support: plays, reach, saved, shares, total_interactions
    metrics = 'reach,saved,impressions,shares';
  }

  try {
    const res = await fetch(
      `${BASE_URL}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`
    );
    const data = await res.json();

    if (data.error) {
      // Insights can fail for older posts, just return zeros
      return { reach: 0, saved: 0, impressions: 0 };
    }

    const insightsList: any[] = data.data || [];
    const get = (name: string) =>
      insightsList.find((i: any) => i.name === name)?.values?.[0]?.value ??
      insightsList.find((i: any) => i.name === name)?.value ??
      0;

    return {
      reach: get('reach'),
      saved: get('saved'),
      impressions: get('impressions'),
    };
  } catch {
    return { reach: 0, saved: 0, impressions: 0 };
  }
}

// ─────────────────────────────────────────────
// Public: Resolve IG account from user access token
// ─────────────────────────────────────────────
export async function getInstagramAccount(userAccessToken: string) {
  const pages = await getFacebookPages(userAccessToken);

  if (!pages || pages.length === 0) {
    throw new Error(
      'No Facebook Pages found. You need a Facebook Page linked to an Instagram Business or Creator account.'
    );
  }

  // Try each page until we find one with an IG Business Account
  for (const page of pages) {
    const igAccount = await getInstagramBusinessAccountFromPage(
      page.id,
      page.access_token || userAccessToken
    );
    if (igAccount) {
      return { ...igAccount, pageAccessToken: page.access_token || userAccessToken };
    }
  }

  throw new Error(
    'No connected Instagram Business or Creator account found. Make sure your Instagram is connected to a Facebook Page as a Business or Creator account.'
  );
}

// ─────────────────────────────────────────────
// Main Sync Engine
// ─────────────────────────────────────────────
export async function syncInstagramData(userId: string, forceRefresh = false) {
  // 1. Get channel from DB
  const { data: channel, error: channelError } = await supabaseAdmin
    .from('channels')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (channelError || !channel) {
    throw new Error('Channel not found for user.');
  }

  if (!channel.access_token) {
    throw new Error('No access token found for channel.');
  }

  // 2. Check 6-hour cache
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const fetchedAt = channel.fetched_at ? new Date(channel.fetched_at) : new Date(0);

  if (!forceRefresh && fetchedAt > sixHoursAgo) {
    return { status: 'cached', fetchedAt: channel.fetched_at };
  }

  // 3. Resolve IG Account via 2-step Graph API flow
  const igAccount = await getInstagramAccount(channel.access_token);

  // Use the page-level access token for subsequent calls (has more permissions)
  const accessToken = igAccount.pageAccessToken || channel.access_token;
  const igAccountId = igAccount.id;

  // 4. Fetch recent media
  const rawPosts = await fetchRecentMedia(igAccountId, accessToken, 25);

  // 5. Fetch insights for each post (parallel, up to 10 at a time)
  const BATCH_SIZE = 10;
  const postsWithInsights: any[] = [];

  for (let i = 0; i < rawPosts.length; i += BATCH_SIZE) {
    const batch = rawPosts.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (post: any) => {
        const insights = await fetchMediaInsights(
          post.id,
          post.media_type,
          accessToken
        );
        return { ...post, insights };
      })
    );
    postsWithInsights.push(...results);
  }

  // 6. Compute metrics
  let totalEngagement = 0;
  let totalSaves = 0;
  let totalReach = 0;
  let postsWithReach = 0;

  const postsToUpsert = postsWithInsights.map((post: any) => {
    const { reach, saved: saves, impressions } = post.insights;
    const likes = post.like_count || 0;
    const comments = post.comments_count || 0;

    // Engagement = likes + comments + saves (per V1 scope definition)
    const engagement = likes + comments + saves;

    if (reach > 0) {
      totalEngagement += engagement;
      totalSaves += saves;
      totalReach += reach;
      postsWithReach++;
    }

    const mediaType =
      post.media_type === 'VIDEO'
        ? 'REEL'
        : post.media_type === 'CAROUSEL_ALBUM'
        ? 'CAROUSEL'
        : 'IMAGE';

    return {
      channel_id: channel.id,
      instagram_media_id: post.id,
      media_type: mediaType,
      caption: post.caption || '',
      hashtags: extractHashtags(post.caption || ''),
      reach,
      impressions,
      engagement_rate: reach > 0 ? (engagement / reach) * 100 : 0,
      saves,
      saves_rate: reach > 0 ? (saves / reach) * 100 : 0,
      shares: 0, // shares metric not always available in basic
      comments_count: comments,
      published_at: post.timestamp,
      fetched_at: new Date().toISOString(),
    };
  });

  const avgEngagementRate =
    totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;
  const avgSavesRate = totalReach > 0 ? (totalSaves / totalReach) * 100 : 0;

  // 7. Persist to Supabase
  const now = new Date().toISOString();

  await supabaseAdmin
    .from('channels')
    .update({
      instagram_user_id: igAccountId,
      username: igAccount.username,
      follower_count: igAccount.followers_count,
      avg_engagement_rate: avgEngagementRate,
      avg_saves_rate: avgSavesRate,
      fetched_at: now,
    })
    .eq('id', channel.id);

  if (postsToUpsert.length > 0) {
    const { error: upsertError } = await supabaseAdmin
      .from('posts')
      .upsert(postsToUpsert, { onConflict: 'instagram_media_id' });

    if (upsertError) {
      console.error('Failed to upsert posts:', upsertError);
    }
  }

  return {
    status: 'synced',
    fetchedAt: now,
    postsCount: postsToUpsert.length,
    igUsername: igAccount.username,
  };
}

function extractHashtags(caption: string): string[] {
  const matches = caption.match(/#[\w]+/g);
  return matches ? matches.map((t) => t.toLowerCase()) : [];
}
