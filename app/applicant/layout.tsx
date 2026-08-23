import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserFromHeaders } from "@/lib/supabase/server";
import ApplicantSidebar from "@/components/applicant/ApplicantSidebar";

export const dynamic = "force-dynamic";

/**
 * Layout architecture (matches the recruiter Shell pattern):
 *  - `<main>` is the flex child that reserves the fixed w-64 sidebar's space
 *    via `lg:pl-64`. It carries NO other padding utilities, so nothing can
 *    ever override the 16rem offset.
 *  - A dedicated inner container owns ALL content padding + the max-width,
 *    so every applicant page starts at the exact same X position.
 */
function AppContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 min-w-0 lg:pl-64 overflow-y-auto overflow-x-hidden">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 xl:px-10 py-6 lg:py-8">
        {children}
      </div>
    </main>
  );
}

/**
 * Thin auth shell — no DB queries.
 *
 * Previously this layout queried applicant_profiles on EVERY navigation
 * within /applicant/*, adding ~50-100ms of server latency before any
 * child page could render. Since the client components (ApplicantDashboardClient,
 * ProfileClient, ApplicationsClient) already fetch their own data via
 * React Query, the layout only needs to verify auth via middleware-injected
 * headers and render the sidebar.
 *
 * Profile creation and role-checking are handled by:
 *  - Middleware: role-based redirects
 *  - Client components: profile existence checks via React Query
 */
export default async function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerUser = getUserFromHeaders();
  if (!headerUser) {
    redirect("/applicant-auth");
  }

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 flex flex-col lg:flex-row antialiased">
      <ApplicantSidebar userEmail={headerUser.email} userName={undefined} />
      <AppContent>{children}</AppContent>
    </div>
  );
}
