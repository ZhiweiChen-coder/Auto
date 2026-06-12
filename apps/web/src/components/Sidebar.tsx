"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { LogoMenu } from "./LogoMenu";

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

const navItems = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/browse", label: "Tools", Icon: GridIcon },
  { href: "/docs", label: "API", Icon: DocsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-x-0 bottom-0 z-30 flex h-16 shrink-0 items-center border-t border-canvas-border bg-canvas-white/95 px-4 backdrop-blur sm:sticky sm:top-0 sm:h-screen sm:w-[72px] sm:flex-col sm:border-r sm:border-t-0 sm:px-0 sm:py-5">
      <Suspense
        fallback={
          <div className="mr-4 flex flex-col items-center gap-0.5 sm:mb-8 sm:mr-0">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas-text font-serif text-xl text-white">
              A
            </span>
            <span className="hidden text-[10px] font-semibold tracking-tight text-canvas-text sm:block">
              Auto
            </span>
          </div>
        }
      >
        <LogoMenu />
      </Suspense>

      <nav className="flex flex-1 items-center justify-center gap-2 sm:flex-col sm:justify-start">
        {navItems.map(({ href, label, Icon }) => {
          const active =
            href === "/"
              ? pathname === "/" || pathname.startsWith("/results")
              : href === "/docs"
                ? pathname.startsWith("/docs")
                : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex h-12 w-14 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas-brand ${
                active
                  ? "bg-canvas-base text-canvas-text"
                  : "text-canvas-subtle hover:bg-canvas-base hover:text-canvas-text"
              }`}
            >
              <Icon />
              <span className="text-[10px] font-semibold leading-none">{label}</span>
            </Link>
          );
        })}

        <a
          href="https://github.com/ZhiweiChen-coder/Auto"
          target="_blank"
          rel="noopener noreferrer"
          title="View source on GitHub"
          aria-label="View source on GitHub"
          className="flex h-12 w-14 flex-col items-center justify-center gap-0.5 rounded-xl text-canvas-muted transition-colors hover:bg-canvas-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-canvas-brand"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span className="text-[10px] font-semibold leading-none">Code</span>
        </a>
      </nav>
    </aside>
  );
}
