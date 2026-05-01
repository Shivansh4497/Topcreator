import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID || process.env.INSTAGRAM_CLIENT_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET || process.env.INSTAGRAM_CLIENT_SECRET,
      authorization: {
        url: "https://www.facebook.com/v18.0/dialog/oauth",
        params: {
          scope: "instagram_basic",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token and providerAccountId to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.providerAccountId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      session.accessToken = token.accessToken as string | undefined;
      session.providerAccountId = token.providerAccountId as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/", // We use the root page as the onboarding/login page
  },
});
