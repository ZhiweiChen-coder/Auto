import { jsonResponse } from "@/lib/api";
import { clearAdminSession } from "@/lib/admin-auth";

export async function POST() {
  await clearAdminSession();
  return jsonResponse({ ok: true });
}
