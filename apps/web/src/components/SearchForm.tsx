"use client";

import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, useRef } from "react";
import { saveRecentSearch } from "./RecentSearches";

type SearchFormProps = {
  initialQuery?: string;
  variant?: "hero" | "compact";
  autoFocus?: boolean;
};

export function SearchForm({
  initialQuery = "",
  variant = "hero",
  autoFocus = false,
}: SearchFormProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isHero = variant === "hero";

  function submit() {
    const task = textareaRef.current?.value.trim() ?? "";
    if (!task) return;
    saveRecentSearch(task);
    router.push(`/results?q=${encodeURIComponent(task)}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div
        className={`relative rounded-[28px] bg-canvas-white shadow-card ring-1 ring-canvas-border/60 transition-shadow focus-within:shadow-[0_12px_40px_rgba(29,29,31,0.10)] ${
          isHero ? "min-h-[190px] sm:min-h-[220px]" : "min-h-[92px]"
        }`}
      >
        <textarea
          ref={textareaRef}
          key={initialQuery}
          defaultValue={initialQuery}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          placeholder={
            isHero
              ? "Describe what you want to accomplish…"
              : "Edit your task…"
          }
          rows={isHero ? 4 : 2}
          className={`textarea-hero w-full resize-none border-0 bg-transparent text-canvas-text placeholder:text-canvas-subtle focus:outline-none focus:ring-0 ${
            isHero
              ? "px-7 pb-20 pt-7 text-2xl font-medium leading-relaxed sm:px-9 sm:pb-20 sm:pt-8 sm:text-3xl"
              : "px-6 pb-12 pt-4 text-base font-medium leading-relaxed"
          }`}
          aria-label="Describe your task"
        />
        <div className="absolute bottom-4 right-4 flex items-center gap-3">
          {!isHero && (
            <span className="hidden text-xs text-canvas-subtle md:inline">
              ⌘ + Enter
            </span>
          )}
          <button
            type="submit"
            className="rounded-full bg-canvas-brand px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-canvas-brandHover"
          >
            Recommend
          </button>
        </div>
      </div>
    </form>
  );
}
