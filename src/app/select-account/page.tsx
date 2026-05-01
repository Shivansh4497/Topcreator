import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AccountSelector from "@/components/AccountSelector";

const GRAPH_API_VERSION = "v18.0";
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export type InstagramAccountOption = {
  igId: string;
  igUsername: string;
  igFollowers: number;
  igPicture: string;
  pageId: string;
  pageName: string;
  pageAccessToken: string;
};

async function fetchInstagramAccounts(
  accessToken: string
): Promise<InstagramAccountOption[]> {
  // Step 1: Get Facebook Pages
  const pagesRes = await fetch(
    `${BASE_URL}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`,
    { cache: "no-store" }
  );
  const pagesData = await pagesRes.json();

  if (pagesData.error) {
    console.error("[select-account] Pages error:", pagesData.error);
    return [];
  }

  const pages: { id: string; name: string; access_token: string }[] =
    pagesData.data || [];

  // Step 2: For each Page, check for linked Instagram Business Account
  const accounts: InstagramAccountOption[] = [];

  await Promise.all(
    pages.map(async (page) => {
      const pageToken = page.access_token || accessToken;
      const igRes = await fetch(
        `${BASE_URL}/${page.id}?fields=instagram_business_account{id,username,followers_count,profile_picture_url}&access_token=${pageToken}`,
        { cache: "no-store" }
      );
      const igData = await igRes.json();

      if (igData.instagram_business_account) {
        const ig = igData.instagram_business_account;
        accounts.push({
          igId: ig.id,
          igUsername: ig.username || "Unknown",
          igFollowers: ig.followers_count || 0,
          igPicture: ig.profile_picture_url || "",
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: pageToken,
        });
      }
    })
  );

  return accounts;
}

export default async function SelectAccountPage() {
  const session = await auth();
  if (!session?.accessToken) {
    redirect("/");
  }

  const accounts = await fetchInstagramAccounts(session.accessToken as string);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black text-white">
      {/* Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/30 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="w-full max-w-lg p-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Select Your Instagram
          </h1>
          <p className="text-zinc-400">
            Choose the Instagram account you want to track and grow.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl">
          <AccountSelector accounts={accounts} />
        </div>

        {accounts.length === 0 && (
          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-300 text-center">
            <p className="font-semibold mb-1">No Instagram Business Accounts found</p>
            <p className="text-yellow-400/70">
              Make sure your Instagram account is set to{" "}
              <strong>Business or Creator</strong> and is connected to a
              Facebook Page. Personal Instagram accounts are not supported by
              the Meta API.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
