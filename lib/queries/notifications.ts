import type { SupabaseClient } from "@supabase/supabase-js";

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationInput {
  type: string;
  title: string;
  body?: string;
  link?: string | null;
}

/** Fetch the current user's notifications (RLS restricts to own rows). */
export async function getNotifications(
  supabase: SupabaseClient,
  limit = 12
): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[NOTIFICATIONS] fetch failed:", error.message);
    return [];
  }
  return (data as AppNotification[]) || [];
}

/** Insert a notification. Runs with the admin client (bypasses RLS); never throws. */
export async function createNotification(
  admin: SupabaseClient,
  userId: string | null | undefined,
  input: NotificationInput
): Promise<void> {
  if (!userId) return;
  try {
    await admin.from("notifications").insert({
      user_id: userId,
      type: input.type,
      title: input.title,
      body: input.body ?? "",
      link: input.link ?? null,
      read: false,
    });
  } catch (err) {
    console.error("[NOTIFICATIONS] insert failed:", err);
  }
}

/** Mark every unread notification as read (client-side, own rows only). */
export async function markNotificationsRead(
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("read", false);
  if (error) {
    console.error("[NOTIFICATIONS] mark-read failed:", error.message);
  }
}
