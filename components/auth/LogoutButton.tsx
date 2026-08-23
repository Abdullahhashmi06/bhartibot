"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function LogoutButton({
  className,
  collapsed = false,
}: {
  className?: string;
  collapsed?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();

  async function handleLogout() {
    // Clear all cached server-state data to prevent cross-user data leakage
    // on same-tab account switches.
    queryClient.clear();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      title="Log out"
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors w-full",
        collapsed && "justify-center px-2",
        className
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      {!collapsed && <span>Log out</span>}
    </button>
  );
}
