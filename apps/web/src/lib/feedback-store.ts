import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { getDataPaths } from "@/lib/paths";

export type FeedbackRating = "good_match" | "not_right" | "too_advanced";

export type FeedbackRecord = {
  id: string;
  createdAt: string;
  query: string;
  rating: FeedbackRating;
  primaryToolId?: string;
  alternativeToolIds?: string[];
  routeLabels?: string[];
  elapsedMs?: number;
  userAgent?: string;
};

export async function saveFeedback(record: FeedbackRecord) {
  const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;
  const store = process.env.FEEDBACK_STORE ?? "file";

  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.FEEDBACK_WEBHOOK_SECRET
          ? { Authorization: `Bearer ${process.env.FEEDBACK_WEBHOOK_SECRET}` }
          : {}),
      },
      body: JSON.stringify(record),
    });

    if (!response.ok) {
      throw new Error(`Feedback webhook failed with ${response.status}`);
    }
  }

  if (store === "webhook") {
    return;
  }

  const { feedbackPath } = getDataPaths();
  await mkdir(dirname(feedbackPath), { recursive: true });
  await appendFile(feedbackPath, `${JSON.stringify(record)}\n`, "utf8");
}

export async function readLocalFeedback(limit = 100): Promise<FeedbackRecord[]> {
  const { feedbackPath } = getDataPaths();

  try {
    const content = await readFile(feedbackPath, "utf8");
    return content
      .split("\n")
      .filter(Boolean)
      .slice(-limit)
      .map((line) => JSON.parse(line) as FeedbackRecord)
      .reverse();
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}
