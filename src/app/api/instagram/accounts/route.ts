import { auth } from "@/auth";
import { NextResponse } from "next/server";

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

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accessToken = session.accessToken as string;

  // Step 1: Get Facebook Pages
  const pagesRes = await fetch(
    `${BASE_URL}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
  );
  const pagesData = await pagesRes.json();

  if (pagesData.error) {
    console.error("[IG accounts] Pages fetch error:", pagesData.error);
    return NextResponse.json(
      { error: pagesData.error.message },
      { status: 400 }
    );
  }

  const pages: { id: string; name: string; access_token: string }[] =
    pagesData.data || [];

  if (pages.length === 0) {
    return NextResponse.json({
      accounts: [],
      message:
        "No Facebook Pages found. You need a Facebook Page connected to an Instagram Business or Creator account.",
    });
  }

  // Step 2: For each Page, fetch connected Instagram Business Account
  const accounts: InstagramAccountOption[] = [];

  await Promise.all(
    pages.map(async (page) => {
      const pageToken = page.access_token || accessToken;
      const igRes = await fetch(
        `${BASE_URL}/${page.id}?fields=instagram_business_account{id,username,followers_count,profile_picture_url}&access_token=${pageToken}`
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

  return NextResponse.json({ accounts });
}
