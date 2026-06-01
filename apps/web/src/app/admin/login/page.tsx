import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin/feedback");
  }

  const configured = isAdminConfigured();

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
      <div className="w-full max-w-md rounded-[28px] bg-canvas-white p-6 shadow-card ring-1 ring-canvas-border/60">
        <p className="text-xs font-bold uppercase tracking-wide text-canvas-muted">
          Admin
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-canvas-text">
          Sign in
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-canvas-muted">
          Use the token from your deployment environment to view feedback.
        </p>

        {configured ? (
          <AdminLoginForm />
        ) : (
          <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-100">
            Set <code>ADMIN_TOKEN</code> to enable admin login.
          </div>
        )}
      </div>
    </div>
  );
}
