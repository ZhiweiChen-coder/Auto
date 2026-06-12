import { HomeClient } from "@/components/HomeClient";

export default function HomePage() {
  return (
    <div className="home-stage flex flex-1 flex-col items-center justify-center px-5 py-16 sm:px-10 sm:py-24">
      <div className="home-stagger w-full max-w-3xl">
        <div className="mb-10 text-center sm:mb-12">
          <p className="mb-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-canvas-subtle">
            <span className="eyebrow-dot h-1 w-1 rounded-full bg-canvas-brand" />
            AI tool router
          </p>
          <h1 className="hero-title font-serif text-5xl font-normal sm:text-7xl">
            Find the <em>right</em> AI tool.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-canvas-muted sm:text-lg">
            Describe the outcome. Auto doesn&apos;t answer your question — it
            points you to the existing AI product that fits best.
          </p>
        </div>
        <HomeClient />
      </div>
    </div>
  );
}
