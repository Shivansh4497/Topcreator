import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { refreshData } from "@/app/actions";

function formatNumber(num: number | null | undefined) {
  if (num === null || num === undefined) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatDate(isoStr: string) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session || !session.user) redirect("/");

  const providerAccountId = (session as any).providerAccountId;
  const email = session.user.email || `${providerAccountId}@instagram.placeholder`;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, goal, niche")
    .eq("email", email)
    .single();

  if (!user) redirect("/process-auth");

  const { data: channel } = await supabaseAdmin
    .from("channels")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!channel) return <div>No channel linked.</div>;

  const { data: posts } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("channel_id", channel.id)
    .order("published_at", { ascending: false })
    .limit(10);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            @{channel.username} &bull; {user.niche} &bull; Goal: {user.goal}
          </p>
        </div>
        <form action={refreshData}>
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <p className="text-sm font-medium text-zinc-400">Total Followers</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold">{formatNumber(channel.follower_count)}</span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <p className="text-sm font-medium text-zinc-400">Avg. Engagement Rate</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-blue-400">{channel.avg_engagement_rate?.toFixed(2)}%</span>
            <span className="text-xs text-zinc-500 font-medium">Last 10 posts</span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <p className="text-sm font-medium text-zinc-400">Avg. Saves Rate</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-indigo-400">{channel.avg_saves_rate?.toFixed(2)}%</span>
            <span className="text-xs text-zinc-500 font-medium">Last 10 posts</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4 tracking-tight">Recent Posts</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-zinc-400 border-b border-white/10 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Post</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Reach</th>
                  <th className="px-6 py-4 text-right">Engagement</th>
                  <th className="px-6 py-4 text-right">Saves</th>
                  <th className="px-6 py-4 text-right">Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts?.map((post) => (
                  <tr key={post.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-white line-clamp-1 max-w-[250px]">
                          {post.caption ? post.caption.split('\n')[0] : "No caption"}
                        </span>
                        <span className="text-xs text-zinc-500 mt-1">{formatDate(post.published_at || '')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-white/10 text-xs font-medium">
                        {post.media_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-zinc-300">{formatNumber(post.reach)}</td>
                    <td className="px-6 py-4 text-right font-medium text-blue-400">{post.engagement_rate?.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-right font-medium text-indigo-400">{post.saves_rate?.toFixed(2)}%</td>
                    <td className="px-6 py-4 text-right font-medium text-zinc-400">{formatNumber(post.comments_count)}</td>
                  </tr>
                ))}
                {!posts || posts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      No posts found. Try refreshing your data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
