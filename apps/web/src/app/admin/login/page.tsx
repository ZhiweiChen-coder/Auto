import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * Standalone admin sign-in. Deliberately NOT linked from the public menu — admin
 * access is reached only by knowing this URL. End users sign in with Google via
 * the main menu instead.
 */
export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) {
    redirect("/admin/feedback");
  }

  const configured = isAdminConfigured();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl text-canvas-text">Admin</h1>
        <p className="mt-2 text-sm text-canvas-muted">
          Sign in with your admin token to access feedback and catalog tuning.
        </p>

        {configured ? (
          <AdminLoginForm />
        ) : (
          <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-100">
            Set <code>ADMIN_TOKEN</code> in the server environment to enable admin
            login.
          </div>
        )}
      </div>
    </main>
  );
}
