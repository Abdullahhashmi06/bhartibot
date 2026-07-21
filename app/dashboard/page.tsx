import { redirect } from "next/navigation";
import Shell from "@/components/layout/Shell";
import { ButtonLink } from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import LogoutButton from "@/components/auth/LogoutButton";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already redirects unauthenticated requests, but a server
  // component should never assume — fail safe if it's ever reached directly.
  if (!user) {
    redirect("/login");
  }

  const fullName = (user.user_metadata?.full_name as string) || null;
  const orgName = (user.user_metadata?.organization_name as string) || null;

  return (
    <Shell>
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <Tag tone="teal">Protected route</Tag>
          <h1 className="mt-3 font-display text-2xl font-medium text-ink">
            Welcome{fullName ? `, ${fullName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {orgName || user.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ButtonLink href="/dashboard/create-internship">
            + Create Internship
          </ButtonLink>
          <LogoutButton />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <h2 className="font-display text-lg font-medium text-ink">
          Your Internships
        </h2>
        <p className="max-w-xs text-sm text-muted">
          You haven&apos;t created any internships yet. Once you do, they&apos;ll
          show up here with applicant counts and status.
        </p>
        <ButtonLink href="/dashboard/create-internship" className="mt-4">
          + Create Internship
        </ButtonLink>
      </div>
    </Shell>
  );
}
