import { redirect } from "next/navigation";
import { Users, Sparkles } from "lucide-react";
import { getUserFromHeaders } from "@/lib/supabase/server";
import { getTalentPool } from "@/lib/queries/talent-pool";
import { createClient } from "@/lib/supabase/server";
import TalentPoolClient from "./TalentPoolClient";

export default async function TalentPoolPage() {
  const supabase = createClient();
  const headerUser = getUserFromHeaders();
  if (!headerUser) redirect("/login");

  const entries = await getTalentPool(supabase, headerUser.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-light text-purple-ai border border-purple-ai/20">
              <Users className="h-4 w-4" />
            </div>
            <h1 className="font-display font-extrabold text-3xl text-primary tracking-tight">
              Talent Pool
            </h1>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            Your reusable pool of starred and saved candidates for future opportunities.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-ai" />
          <span className="font-mono text-sm font-semibold text-text-muted">
            {entries.length} candidate{entries.length !== 1 && "s"}
          </span>
        </div>
      </div>

      <TalentPoolClient entries={entries} recruiterId={headerUser.id} />
    </div>
  );
}
