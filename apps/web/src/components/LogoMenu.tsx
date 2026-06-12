"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut as googleSignOut, useSession } from "next-auth/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { AutoLogo } from "./AutoLogo";
import { clearRecentSearches, readRecentSearchCount } from "./RecentSearches";

type MenuView = "menu" | "signin" | "register" | "settings";

type SessionState = {
  authenticated: boolean;
  configured: boolean;
};

const SWIPE_CLOSE_THRESHOLD = 72;

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 001.82-.33 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5 20c1.35-3.2 3.65-4.8 7-4.8s5.65 1.6 7 4.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function RegisterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16 11h6M19 8v6M12 13a4 4 0 100-8 4 4 0 000 8zM6 20v-1a4 4 0 014-4h.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FeedbackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 19V5a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1H7l-3 4z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M8 9h8M8 13h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 21H6a1 1 0 01-1-1V4a1 1 0 011-1h3M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M21.6 12.23c0-.66-.06-1.3-.17-1.9H12v3.6h5.38a4.6 4.6 0 01-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.22z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.23-2.5c-.9.6-2.05.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0012 22z"
        fill="#34A853"
      />
      <path
        d="M6.41 13.91a6 6 0 010-3.82V7.5H3.07a10 10 0 000 9l3.34-2.59z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.58c1.47 0 2.78.5 3.82 1.49l2.85-2.85A10 10 0 0012 2 10 10 0 003.07 7.5l3.34 2.59C7.2 8.33 9.4 6.58 12 6.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function menuItemClassName() {
  return "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-canvas-text transition-colors hover:bg-canvas-base focus-visible:bg-canvas-base focus-visible:outline-none";
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled") && element.offsetParent !== null);
}

export function LogoMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: googleSession } = useSession();
  const googleUser = googleSession?.user;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<MenuView>("menu");
  const [sheetOffset, setSheetOffset] = useState(0);
  const [session, setSession] = useState<SessionState>({
    authenticated: false,
    configured: false,
  });
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [recentCount, setRecentCount] = useState(0);

  const clearAccountQuery = useCallback(() => {
    if (!searchParams.has("account")) return;

    const params = new URLSearchParams(searchParams.toString());
    params.delete("account");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const closeMenu = useCallback(() => {
    setOpen(false);
    setView("menu");
    setSheetOffset(0);
    dragStartY.current = null;
    clearAccountQuery();
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, [clearAccountQuery]);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/session");
      if (response.ok) {
        setSession(await response.json());
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const account = searchParams.get("account");
    if (account === "signin" || account === "register" || account === "settings") {
      setOpen(true);
      setView(account);
    }
  }, [searchParams]);

  // Recent-search count is browser-local, so read it when the settings view opens.
  useEffect(() => {
    if (view === "settings") setRecentCount(readRecentSearchCount());
  }, [view]);

  useEffect(() => {
    if (!open) return;

    void refreshSession();

    const previousOverflow = document.body.style.overflow;
    if (window.matchMedia("(max-width: 639px)").matches) {
      document.body.style.overflow = "hidden";
    }

    requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = getFocusableElements(panel);
      focusable[0]?.focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      const panel = panelRef.current;
      if (!panel) return;

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        if (view !== "menu") return;

        const items = getFocusableElements(panel).filter(
          (element) => element.getAttribute("role") === "menuitem",
        );
        if (items.length === 0) return;

        event.preventDefault();
        const currentIndex = items.indexOf(document.activeElement as HTMLElement);
        const nextIndex =
          event.key === "ArrowDown"
            ? (currentIndex + 1 + items.length) % items.length
            : (currentIndex - 1 + items.length) % items.length;
        items[nextIndex]?.focus();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(panel);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onPointerDown(event: MouseEvent) {
      if (window.matchMedia("(min-width: 640px)").matches) {
        if (!containerRef.current?.contains(event.target as Node)) {
          closeMenu();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeMenu, open, refreshSession, view]);

  function onSheetTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (!window.matchMedia("(max-width: 639px)").matches) return;
    dragStartY.current = event.touches[0]?.clientY ?? null;
    setSheetOffset(0);
  }

  function onSheetTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    if (dragStartY.current === null) return;

    const currentY = event.touches[0]?.clientY ?? dragStartY.current;
    const delta = Math.max(0, currentY - dragStartY.current);
    setSheetOffset(delta);
  }

  function onSheetTouchEnd() {
    if (sheetOffset >= SWIPE_CLOSE_THRESHOLD) {
      closeMenu();
      return;
    }

    dragStartY.current = null;
    setSheetOffset(0);
  }

  async function signOut() {
    setIsSigningOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    await refreshSession();
    setIsSigningOut(false);
    closeMenu();
    router.refresh();
  }

  function openView(nextView: MenuView) {
    setView(nextView);
  }

  const panelTitle =
    view === "signin"
      ? "Sign in"
      : view === "register"
        ? "Create account"
        : view === "settings"
          ? "Settings"
          : "Auto";

  const menuLabel = session.authenticated ? "Auto menu, signed in" : "Auto menu";
  const sheetStyle =
    sheetOffset > 0
      ? {
          transform: `translateY(${sheetOffset}px)`,
          transition: dragStartY.current === null ? "transform 180ms ease-out" : "none",
        }
      : undefined;

  return (
    <div ref={containerRef} className="relative mr-4 sm:mb-8 sm:mr-0">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (open) {
            closeMenu();
          } else {
            setOpen(true);
            setView("menu");
          }
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={menuLabel}
        title={session.authenticated ? "Signed in" : "Open menu"}
        className="group flex flex-col items-center gap-0.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas-brand"
      >
        <span className="relative">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform ${
              open ? "scale-95" : "group-hover:scale-[1.02]"
            } ${session.authenticated ? "ring-2 ring-emerald-400/80 ring-offset-2 ring-offset-canvas-white" : ""}`}
          >
            <AutoLogo />
          </span>
          {session.authenticated ? (
            <span
              className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-canvas-white bg-emerald-500"
              aria-hidden
            />
          ) : null}
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-canvas-white text-canvas-brand shadow-soft ring-1 ring-canvas-border/70">
            <ChevronIcon open={open} />
          </span>
        </span>
        <span className="hidden text-[10px] font-bold tracking-tight text-canvas-text sm:block">
          Auto
        </span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="menu-sheet-backdrop fixed inset-0 z-40 bg-black/30 sm:hidden"
            onClick={closeMenu}
          />

          <div
            ref={panelRef}
            role="menu"
            aria-label={panelTitle}
            style={sheetStyle}
            className="menu-sheet-panel fixed inset-x-0 bottom-0 z-50 max-h-[min(85vh,32rem)] overflow-hidden rounded-t-[28px] border border-canvas-border bg-canvas-white shadow-card sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-[calc(100%+12px)] sm:top-0 sm:w-72 sm:max-h-[min(32rem,calc(100vh-2rem))] sm:rounded-2xl"
          >
            <div
              onTouchStart={onSheetTouchStart}
              onTouchMove={onSheetTouchMove}
              onTouchEnd={onSheetTouchEnd}
              className="touch-none sm:touch-auto"
            >
              <div className="flex justify-center pt-3 sm:hidden">
                <span className="h-1 w-10 rounded-full bg-canvas-border" />
              </div>

              <div className="flex items-center gap-2 border-b border-canvas-border px-4 py-3">
                {view !== "menu" ? (
                  <button
                    type="button"
                    onClick={() => setView("menu")}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-canvas-muted transition-colors hover:bg-canvas-base hover:text-canvas-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-brand/30"
                    aria-label="Back to menu"
                  >
                    <BackIcon />
                  </button>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-canvas-text">{panelTitle}</p>
                  {view === "menu" && session.authenticated ? (
                    <p className="text-xs font-semibold text-emerald-600">Signed in as admin</p>
                  ) : view === "menu" && googleUser ? (
                    <p className="truncate text-xs font-semibold text-emerald-600">
                      {googleUser.email ?? "Signed in"}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="overflow-y-auto p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {view === "menu" && (
                  <div className="space-y-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => openView("settings")}
                      className={menuItemClassName()}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-canvas-base text-canvas-muted">
                        <SettingsIcon />
                      </span>
                      Settings
                    </button>

                    {session.authenticated ? (
                      <>
                        <Link
                          href="/admin/feedback"
                          role="menuitem"
                          onClick={closeMenu}
                          className={menuItemClassName()}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-canvas-brandLight text-canvas-brand">
                            <FeedbackIcon />
                          </span>
                          Feedback admin
                        </Link>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={signOut}
                          disabled={isSigningOut}
                          className={`${menuItemClassName()} text-red-700 hover:bg-red-50 focus-visible:bg-red-50`}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                            <LogOutIcon />
                          </span>
                          {isSigningOut ? "Signing out..." : "Sign out"}
                        </button>
                      </>
                    ) : googleUser ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => googleSignOut()}
                        className={`${menuItemClassName()} text-red-700 hover:bg-red-50 focus-visible:bg-red-50`}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                          <LogOutIcon />
                        </span>
                        Sign out
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => openView("signin")}
                          className={menuItemClassName()}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-canvas-brandLight text-canvas-brand">
                            <SignInIcon />
                          </span>
                          Sign in
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => openView("register")}
                          className={menuItemClassName()}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-canvas-base text-canvas-muted">
                            <RegisterIcon />
                          </span>
                          Register
                        </button>
                      </>
                    )}
                  </div>
                )}

                {view === "signin" && (
                  <div className="px-2 py-1">
                    {googleUser ? (
                      <div className="rounded-xl border border-canvas-border bg-canvas-base/60 p-3">
                        <div className="flex items-center gap-3">
                          {googleUser.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={googleUser.image}
                              alt=""
                              className="h-9 w-9 rounded-full"
                            />
                          ) : (
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas-brandLight text-canvas-brand">
                              <GoogleIcon />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-canvas-text">
                              {googleUser.name ?? "Signed in"}
                            </p>
                            <p className="truncate text-xs text-canvas-muted">
                              {googleUser.email}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => googleSignOut()}
                          className="mt-3 w-full rounded-full bg-canvas-base px-4 py-2 text-xs font-semibold text-canvas-muted transition-colors hover:text-canvas-text"
                        >
                          Sign out of Google
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="mb-3 px-1 text-xs leading-5 text-canvas-muted">
                          Sign in to keep your credits attached to your account.
                        </p>
                        <button
                          type="button"
                          onClick={() => signIn("google")}
                          className="flex w-full items-center justify-center gap-2.5 rounded-full border border-canvas-border bg-canvas-white px-4 py-2.5 text-sm font-semibold text-canvas-text shadow-soft transition-colors hover:bg-canvas-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-brand/30"
                        >
                          <GoogleIcon />
                          Continue with Google
                        </button>
                      </>
                    )}
                  </div>
                )}

                {view === "register" && (
                  <div className="space-y-4 px-2 py-1">
                    <p className="text-xs leading-5 text-canvas-muted">
                      Create your account with Google — no separate password to
                      manage. Your credits stay attached to your account.
                    </p>
                    <button
                      type="button"
                      onClick={() => signIn("google")}
                      className="flex w-full items-center justify-center gap-2.5 rounded-full border border-canvas-border bg-canvas-white px-4 py-2.5 text-sm font-semibold text-canvas-text shadow-soft transition-colors hover:bg-canvas-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-brand/30"
                    >
                      <GoogleIcon />
                      Continue with Google
                    </button>
                  </div>
                )}

                {view === "settings" && (
                  <div className="space-y-5 px-2 py-1">
                    <section>
                      <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-canvas-muted">
                        Account
                      </p>
                      {googleUser ? (
                        <div className="mt-2 rounded-xl border border-canvas-border bg-canvas-base/60 p-3">
                          <div className="flex items-center gap-3">
                            {googleUser.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={googleUser.image}
                                alt=""
                                className="h-9 w-9 rounded-full"
                              />
                            ) : (
                              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas-brandLight text-canvas-brand">
                                <GoogleIcon />
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-canvas-text">
                                {googleUser.name ?? "Signed in"}
                              </p>
                              <p className="truncate text-xs text-canvas-muted">
                                {googleUser.email}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => googleSignOut()}
                            className="mt-3 w-full rounded-full bg-canvas-base px-4 py-2 text-xs font-semibold text-canvas-muted transition-colors hover:text-canvas-text"
                          >
                            Sign out
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => signIn("google")}
                          className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-full border border-canvas-border bg-canvas-white px-4 py-2.5 text-sm font-semibold text-canvas-text shadow-soft transition-colors hover:bg-canvas-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas-brand/30"
                        >
                          <GoogleIcon />
                          Continue with Google
                        </button>
                      )}
                    </section>

                    <section>
                      <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-canvas-muted">
                        Privacy
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-canvas-border px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-canvas-text">
                            Recent searches
                          </p>
                          <p className="text-xs text-canvas-muted">
                            {recentCount > 0
                              ? `${recentCount} stored in this browser`
                              : "Nothing stored"}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={recentCount === 0}
                          onClick={() => {
                            clearRecentSearches();
                            setRecentCount(0);
                            router.refresh();
                          }}
                          className="shrink-0 rounded-full bg-canvas-base px-3 py-1.5 text-xs font-semibold text-canvas-muted transition-colors hover:text-canvas-text disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Clear
                        </button>
                      </div>
                    </section>
                  </div>
                )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
