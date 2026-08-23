import Shell from "@/components/layout/Shell";

/**
 * Persistent layout for all /dashboard/* routes.
 *
 * This layout wraps all dashboard pages in Shell so the sidebar, command
 * palette, keyboard shortcuts, and toaster persist across client-side
 * navigations. Only the page content inside Shell swaps on navigation —
 * the sidebar never unmounts/remounts.
 *
 * Combined with the removal of loading.tsx for these routes, this means
 * navigating between dashboard pages shows cached React Query data
 * instantly without any skeleton flash.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Shell>{children}</Shell>;
}
