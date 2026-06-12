"use client";

import { SessionProvider } from "next-auth/react";

/** Client providers shared across the app. Hosts the Auth.js session context so
 * components can call useSession()/signIn()/signOut(). */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
