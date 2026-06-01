import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readLocalFeedback, type FeedbackRecord } from "@/lib/feedback-store";

export const dynamic = "force-dynamic";

const ratingLabels: Record<FeedbackRecord["rating"], string> = {
  good_match: "Good match",
  not_right: "Not right",
  too_advanced: "Too advanced",
};

function countByRating(records: FeedbackRecord[], rating: FeedbackRecord["rating"]) {
  return records.filter((record) => record.rating === rating).length;
}

export default async function FeedbackAdminPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const records = await readLocalFeedback(100);
  const store = process.env.FEEDBACK_STORE ?? "file";

  return (
    <div className="flex-1 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-canvas-muted">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-canvas-text">
              Feedback
            </h1>
          </div>
          <p className="rounded-full bg-canvas-base px-3 py-1 text-xs font-semibold text-canvas-muted">
            Store: {store}
          </p>
          <AdminLogoutButton />
        </div>

        {store === "webhook" && (
          <div className="mt-6 rounded-2xl bg-canvas-white p-5 text-sm text-canvas-muted shadow-soft ring-1 ring-canvas-border/60">
            Webhook storage is active. Use your external destination for the full
            production dashboard.
          </div>
        )}

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          {(["good_match", "not_right", "too_advanced"] as const).map((rating) => (
            <div
              key={rating}
              className="rounded-2xl bg-canvas-white p-5 shadow-soft ring-1 ring-canvas-border/60"
            >
              <p className="text-sm font-semibold text-canvas-muted">
                {ratingLabels[rating]}
              </p>
              <p className="mt-2 text-3xl font-bold text-canvas-text">
                {countByRating(records, rating)}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6 overflow-hidden rounded-[28px] bg-canvas-white shadow-card ring-1 ring-canvas-border/60">
          <div className="border-b border-canvas-border px-5 py-4">
            <h2 className="text-lg font-bold text-canvas-text">
              Latest responses
            </h2>
          </div>

          {records.length === 0 ? (
            <p className="px-5 py-8 text-sm text-canvas-muted">
              No feedback yet.
            </p>
          ) : (
            <div className="divide-y divide-canvas-border">
              {records.map((record) => (
                <article key={record.id} className="px-5 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="w-fit rounded-full bg-canvas-brandLight px-3 py-1 text-xs font-bold text-canvas-brand">
                      {ratingLabels[record.rating]}
                    </span>
                    <time className="text-xs text-canvas-subtle">
                      {new Date(record.createdAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-canvas-text">
                    {record.query}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-canvas-muted">
                    {record.primaryToolId && (
                      <span className="rounded-full bg-canvas-base px-3 py-1">
                        Primary: {record.primaryToolId}
                      </span>
                    )}
                    {record.elapsedMs !== undefined && (
                      <span className="rounded-full bg-canvas-base px-3 py-1">
                        {(record.elapsedMs / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
