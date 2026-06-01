export default function DocsPage() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-2xl prose prose-slate">
        <h1 className="text-3xl font-bold text-canvas-text">API</h1>
        <p className="mt-2 text-canvas-muted">
          Auto recommends tools — it does not answer your task. All endpoints
          return JSON.
        </p>

        <section className="mt-10 space-y-6 text-sm text-canvas-text">
          <div className="rounded-2xl bg-canvas-white p-5 shadow-soft">
            <h2 className="font-bold">POST /api/v1/recommend</h2>
            <p className="mt-2 text-canvas-muted">
              Body: <code className="text-canvas-brand">{`{ "query": string, "limit"?: 0-3 }`}</code>
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-canvas-base p-4 text-xs">
{`curl -X POST ${base}/api/v1/recommend \\
  -H "Content-Type: application/json" \\
  -d '{"query": "build a landing page today"}'`}
            </pre>
            <p className="mt-3 text-canvas-muted">
              Response includes the recommended tools plus task understanding,
              first steps, route cards, and a copy-ready prompt when available.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl bg-canvas-base p-4 text-xs">
{`{
  "task": { "intent": "design", "output": "poster", "userLevel": "beginner" },
  "primary": { "toolId": "canva", "confidence": "high", "reason": "..." },
  "actionGuide": {
    "firstSteps": ["Open the tool", "Paste the prompt"],
    "copyPrompt": "Create a poster for..."
  },
  "routeCards": [
    {
      "label": "Fastest route",
      "toolIds": ["canva"],
      "tradeoff": "Fast, but less custom."
    }
  ]
}`}
            </pre>
            <p className="mt-3 text-canvas-muted">
              Optional header: <code>Authorization: Bearer YOUR_OPENAI_KEY</code> (BYOK)
            </p>
          </div>

          <div className="rounded-2xl bg-canvas-white p-5 shadow-soft">
            <h2 className="font-bold">GET /api/v1/tools</h2>
            <p className="mt-2 text-canvas-muted">
              Query: <code>?category=search&page=1&pageSize=50</code>
            </p>
          </div>

          <div className="rounded-2xl bg-canvas-white p-5 shadow-soft">
            <h2 className="font-bold">GET /api/v1/tools/:id</h2>
            <p className="mt-2 text-canvas-muted">Single tool from the catalog.</p>
          </div>

          <div className="rounded-2xl bg-canvas-white p-5 shadow-soft">
            <h2 className="font-bold">POST /api/v1/feedback</h2>
            <p className="mt-2 text-canvas-muted">
              Body:{" "}
              <code className="text-canvas-brand">
                {`{ "query": string, "rating": "good_match" | "not_right" | "too_advanced" }`}
              </code>
            </p>
            <p className="mt-3 text-canvas-muted">
              Stores lightweight recommendation feedback for product tuning.
            </p>
          </div>

          <div className="rounded-2xl bg-canvas-white p-5 shadow-soft">
            <h2 className="font-bold">GET /api/v1/health</h2>
            <p className="mt-2 text-canvas-muted">Status and catalog version.</p>
          </div>

          <p className="text-canvas-muted">
            Full spec:{" "}
            <a
              href="https://github.com"
              className="font-medium text-canvas-brand hover:underline"
            >
              openapi.yaml
            </a>{" "}
            in the repository root.
          </p>
        </section>
      </div>
    </div>
  );
}
