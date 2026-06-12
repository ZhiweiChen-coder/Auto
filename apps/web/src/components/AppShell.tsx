import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col pb-16 sm:pb-0">
        {children}
        <Footer />
      </div>
    </div>
  );
}
