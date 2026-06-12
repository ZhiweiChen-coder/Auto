import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin/feedback");
  }

  redirect("/?account=signin");
}
