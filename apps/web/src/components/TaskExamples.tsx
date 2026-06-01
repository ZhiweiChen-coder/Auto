"use client";

const EXAMPLES = [
  {
    label: "Meeting notes",
    accent: "bg-canvas-sunshine",
    prompt: "Help me pick an AI tool to turn a meeting recording into clear notes and action items",
  },
  {
    label: "Social cover",
    accent: "bg-canvas-mint",
    prompt: "I want to make a social media cover image as a beginner without designing from scratch",
  },
  {
    label: "Research report",
    accent: "bg-sky-400",
    prompt: "I need to research a topic and write a report with cited sources",
  },
  {
    label: "Launch a site",
    accent: "bg-violet-500",
    prompt: "I want to launch a website, but I do not code and need AI to generate the first version",
  },
];

export function TaskExamples({ onPick }: { onPick: (query: string) => void }) {
  return (
    <section className="mt-5">
      <div className="flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onPick(item.prompt)}
            title={item.prompt}
            className="group inline-flex items-center gap-2 rounded-full border border-canvas-border bg-white/70 px-3.5 py-2 text-sm font-semibold text-canvas-muted shadow-soft transition-all hover:-translate-y-0.5 hover:border-canvas-brand hover:text-canvas-text hover:shadow-card"
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.accent}`}
            />
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
