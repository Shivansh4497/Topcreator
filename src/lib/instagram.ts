import { supabaseAdmin } from './supabase';

const GRAPH_API_VERSION = 'v18.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Resolves the connected Instagram Business/Creator Account ID
 * from a Facebook Access Token.
 */
export async function getInstagramAccount(accessToken: string) {
  const res = await fetch(
    `${BASE_URL}/me/accounts?fields=instagram_business_account{id,username,followers_count}&access_token=${accessToken}`
  );
  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  // Find the first page that has a connected Instagram Business Account
  const pageWithIg = data.data?.find((page: any) => page.instagram_business_account);
  
  if (!pageWithIg) {
    throw new Error("No connected Instagram Business or Creator account found for this Facebook account.");
  }

  return pageWithIg.instagram_business_account;
}

/**
 * Fetches recent posts and their insights from the Graph API.
 */
export async function fetchRecentPostsFromAPI(igAccountId: string, accessToken: string) {
  // We need reach, saved, shares. 'plays' is valid for Reels.
  // Note: Insights metrics available depend on media type.
  const fields = 'id,media_type,caption,comments_count,like_count,timestamp,insights.metric(reach,saved,shares)';
  
  const res = await fetch(
    `${BASE_URL}/${igAccountId}/media?fields=${fields}&access_token=${accessToken}&limit=10`
  );
  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.data;
}

/**
 * Main Synchronization Engine (Handles the 6-hour caching rule)
 * Can be triggered on page load or by a manual "Refresh" button.
 */
export async function syncInstagramData(userId: string, forceRefresh = false) {
  // 1. Get channel info from DB
  const { data: channel, error: channelError } = await supabaseAdmin
    .from('channels')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (channelError || !channel) {
    throw new Error("Channel not found for user.");
  }

  if (!channel.access_token) {
    throw new Error("No access token found for channel.");
  }

  // 2. Check Cache (6 hours rule)
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const fetchedAt = channel.fetched_at ? new Date(channel.fetched_at) : new Date(0);

  if (!forceRefresh && fetchedAt > sixHoursAgo) {
    // Cache is fresh, do nothing
    return { status: 'cached', fetchedAt: channel.fetched_at };
  }

  // 3. Cache is stale or forced refresh. Fetch from API.
  let igAccount;
  try {
    igAccount = await getInstagramAccount(channel.access_token);
  } catch (error: any) {
    throw new Error(`Failed to resolve IG account: ${error.message}`);
  }

  let postsData = [];
  try {
    postsData = await fetchRecentPostsFromAPI(igAccount.id, channel.access_token);
  } catch (error: any) {
    throw new Error(`Failed to fetch posts: ${error.message}`);
  }

  // 4. Process metrics
  let totalEngagement = 0;
  let totalSaves = 0;
  let totalReach = 0;

  const postsToUpsert = postsData.map((post: any) => {
    // Extract insights
    const insights = post.insights?.data || [];
    const reach = insights.find((i: any) => i.name === 'reach')?.values[0]?.value || 0;
    const saves = insights.find((i: any) => i.name === 'saved')?.values[0]?.value || 0;
    const shares = insights.find((i: any) => i.name === 'shares')?.values[0]?.value || 0;
    
    // According to v1_scope: engagement = (likes + comments + saves)
    const postEngagement = (post.like_count || 0) + (post.comments_count || 0) + saves;
    
    // Accumulate for averages
    if (reach > 0) {
      totalEngagement += postEngagement;
      totalSaves += saves;
      totalReach += reach;
    }

    const mediaType = post.media_type === 'VIDEO' ? 'REEL' : post.media_type === 'CAROUSEL_ALBUM' ? 'CAROUSEL' : 'IMAGE';

    return {
      channel_id: channel.id,
      instagram_media_id: post.id,
      media_type: mediaType,
      caption: post.caption || "",
      hashtags: extractHashtags(post.caption || ""),
      reach: reach,
      impressions: reach, // Approximation since impressions isn't always available via basic insights
      engagement_rate: reach > 0 ? (postEngagement / reach) * 100 : 0,
      saves: saves,
      saves_rate: reach > 0 ? (saves / reach) * 100 : 0,
      shares: shares,
      comments_count: post.comments_count || 0,
      published_at: post.timestamp,
      fetched_at: new Date().toISOString()
    };
  });

  // Calculate Averages
  const avgEngagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;
  const avgSavesRate = totalReach > 0 ? (totalSaves / totalReach) * 100 : 0;

  // 5. Save to DB
  const now = new Date().toISOString();

  await supabaseAdmin
    .from('channels')
    .update({
      instagram_user_id: igAccount.id,
      username: igAccount.username,
      follower_count: igAccount.followers_count,
      avg_engagement_rate: avgEngagementRate,
      avg_saves_rate: avgSavesRate,
      fetched_at: now
    })
    .eq('id', channel.id);

  if (postsToUpsert.length > 0) {
    // Upsert posts using instagram_media_id as the unique key
    const { error: upsertError } = await supabaseAdmin
      .from('posts')
      .upsert(postsToUpsert, { onConflict: 'instagram_media_id' });
      
    if (upsertError) {
      console.error("Failed to upsert posts:", upsertError);
      // We don't throw here to avoid failing the whole sync just because one post failed,
      // but in production we might want more robust error handling.
    }
  }

  return { status: 'synced', fetchedAt: now };
}

function extractHashtags(caption: string): string[] {
  const matches = caption.match(/#[\w]+/g);
  return matches ? matches.map(t => t.toLowerCase()) : [];
}
