import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isOpenMode } from "@/lib/config";
import { supabaseConfigured } from "@/lib/credits/gate";
import { clearAnonCookie, readUserId } from "@/lib/credits/identity";

/**
 * Google sign-in via Auth.js (NextAuth v5). JWT sessions only — no extra tables.
 * Optional: with no AUTH_GOOGLE_ID/SECRET the provider simply can't complete a
 * round-trip, but the rest of the app is unaffected.
 *
 * Credit subject for an authenticated user is `google:<sub>` (a stable Google
 * account id). This is the real-accounts replacement for the bypassable
 * anonymous id in lib/credits/identity.ts. The admin-token flow is separate and
 * untouched.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    // Stamp the stable account id onto the token on first sign-in; it persists
    // across refreshes thereafter.
    async jwt({ token, profile }) {
      if (profile?.sub) {
        (token as { uid?: string }).uid = `google:${profile.sub}`;
      }
      return token;
    },
    // Expose the account id to the client/server as session.user.id.
    async session({ session, token }) {
      const uid = (token as { uid?: string }).uid;
      if (uid && session.user) {
        (session.user as { id?: string }).id = uid;
      }
      return session;
    },
  },
  events: {
    // One-time merge: fold the anonymous credit balance into the account so a
    // user keeps the credits they earned before signing in. Best-effort — a
    // failure here must never block login.
    async signIn({ profile }) {
      if (!profile?.sub) return;
      if (!isOpenMode() || !supabaseConfigured()) return;
      try {
        const anonId = await readUserId();
        if (!anonId) return;
        const { mergeCredits } = await import("@/lib/credits/supabase-gate");
        await mergeCredits(anonId, `google:${profile.sub}`);
        await clearAnonCookie();
      } catch (err) {
        console.error("[auth] credit merge on sign-in failed:", err);
      }
    },
  },
});
