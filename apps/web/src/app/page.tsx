import { HomeClient } from "@/components/HomeClient";

export default function HomePage() {
  return (
    <div className="home-stage flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-10">
      <div className="home-stagger w-full max-w-4xl">
        <div className="mb-7 text-center">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-canvas-brand">
            <span className="eyebrow-dot h-1.5 w-1.5 rounded-full bg-canvas-brand" />
            AI tool router
          </p>
          <h1 className="hero-title text-4xl font-bold tracking-tight sm:text-6xl">
            Find the right AI tool.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-canvas-muted sm:text-lg">
            Describe the outcome. Auto doesn&apos;t answer your question — it
            points you to the existing AI product that fits best.
          </p>
        </div>
        <HomeClient />
      </div>
    </div>
  );
}
