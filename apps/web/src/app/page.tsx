import { HomeClient } from "@/components/HomeClient";

const signals = [
  ["69", "curated tools"],
  ["3", "route tradeoffs"],
  ["BYOK", "private API option"],
];

export default function HomePage() {
  return (
    <div className="home-stage flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-10">
      <div className="home-enter w-full max-w-4xl">
        <div className="mb-7 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-canvas-brand">
            AI tool router
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-canvas-text sm:text-6xl">
            Find the right AI tool.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-canvas-muted sm:text-lg">
            Describe the outcome, and Auto compares real products by speed,
            cost, setup effort, and fit.
          </p>
        </div>
        <HomeClient />
        <dl className="mx-auto mt-8 grid max-w-2xl grid-cols-3 overflow-hidden rounded-2xl border border-canvas-border bg-white/70 text-center shadow-soft backdrop-blur">
          {signals.map(([value, label]) => (
            <div key={label} className="border-r border-canvas-border px-3 py-4 last:border-r-0">
              <dt className="text-lg font-bold text-canvas-text">{value}</dt>
              <dd className="mt-1 text-xs font-medium text-canvas-muted">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
