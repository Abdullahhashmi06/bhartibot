"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  RefreshCw,
  CheckCheck,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  Inbox,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getNotifications,
  markNotificationsRead,
  type AppNotification,
} from "@/lib/queries/notifications";
import { cn } from "@/lib/utils";

export default function NotificationsPanel({
  className,
}: {
  className?: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getNotifications(supabase);
    setItems(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const unreadCount = items.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    setBusy(true);
    await markNotificationsRead(supabase);
    await load();
    setBusy(false);
  };

  const openNotification = async (n: AppNotification) => {
    if (!n.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.link) router.push(n.link);
  };

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function iconFor(type: string) {
    if (type.startsWith("interview_accepted") || type.startsWith("interview_reschedule_approved")) {
      return <CalendarCheck className="h-4 w-4 text-emerald" />;
    }
    if (type.startsWith("interview_cancelled")) {
      return <CalendarX className="h-4 w-4 text-rose-400" />;
    }
    if (type.startsWith("interview_reschedule") || type.startsWith("interview_missed")) {
      return <CalendarClock className="h-4 w-4 text-amber-500" />;
    }
    return <Bell className="h-4 w-4 text-teal" />;
  }

  return (
    <section
      className={cn(
        "rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-card",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-light dark:bg-teal/20 text-teal-dark dark:text-teal border border-teal/20">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold text-primary dark:text-white">
              Notifications
            </h2>
            <p className="text-xs text-text-muted">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={load}
            title="Refresh"
            className="rounded-lg p-2 text-text-muted hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal/30 bg-teal-light px-2.5 py-1.5 text-[11px] font-semibold text-teal-dark hover:bg-teal/20 transition-colors dark:bg-teal/15 dark:text-teal disabled:opacity-60"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-text-secondary">No notifications yet.</p>
          </div>
        )}

        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => openNotification(n)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all",
              n.read
                ? "border-border dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                : "border-teal/20 bg-teal-light/40 dark:bg-teal/10 hover:bg-teal-light/70 dark:hover:bg-teal/15"
            )}
          >
            <div className="mt-0.5 shrink-0">{iconFor(n.type)}</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-primary dark:text-white">
                {n.title}
              </p>
              {n.body && (
                <p className="mt-0.5 text-xs text-text-secondary dark:text-slate-400 line-clamp-2">
                  {n.body}
                </p>
              )}
              <p className="mt-1 text-[10px] font-mono uppercase tracking-wider text-text-muted">
                {timeAgo(n.created_at)}
              </p>
            </div>
            {!n.read && (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal" />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
