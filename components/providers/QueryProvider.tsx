"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // staleTime: data is considered fresh for 30 seconds by default
            // Pages override per-query as needed
            staleTime: 30_000,
            // gcTime: keep unused data in cache for 5 minutes
            gcTime: 5 * 60_000,
            // refetchOnWindowFocus: revalidate when user returns to tab
            refetchOnWindowFocus: true,
            // refetchOnMount: only refetch if stale
            refetchOnMount: true,
            // retry once on failure
            retry: 1,
            // Don't refetch on reconnect by default for instant back-nav
            refetchOnReconnect: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
