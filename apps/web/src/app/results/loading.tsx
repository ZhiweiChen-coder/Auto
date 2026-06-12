export default function ResultsLoading() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="loading-panel w-full max-w-2xl rounded-3xl border border-canvas-border bg-canvas-white p-8 shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-canvas-text text-lg font-semibold text-white">
          A
        </div>
        <div className="mt-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-canvas-subtle">
            Preparing Auto
          </p>
          <h1 className="mt-2 font-serif text-3xl font-normal text-canvas-text">
            Loading the catalog
          </h1>
        </div>

        <div className="mx-auto mt-8 max-w-xl space-y-3">
          {["Opening page", "Reading tools"].map(
            (label, index) => (
              <div
                key={label}
                className="loading-row flex items-center gap-3 rounded-2xl border border-canvas-border bg-canvas-base/70 px-4 py-3"
                style={{ animationDelay: `${index * 160}ms` }}
              >
                <span className="loading-dot h-2.5 w-2.5 rounded-full bg-canvas-brand" />
                <span className="text-sm font-semibold text-canvas-text">
                  {label}
                </span>
                <span className="ml-auto h-1.5 w-28 overflow-hidden rounded-full bg-white">
                  <span className="loading-bar block h-full rounded-full bg-canvas-text" />
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
