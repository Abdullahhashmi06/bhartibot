import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getUserFromHeaders } from "@/lib/supabase/server";
import SearchPageClient from "./SearchPageClient";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const headerUser = getUserFromHeaders();
  if (!headerUser) redirect("/login");

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-teal">
            <Sparkles className="h-4 w-4" />
          </div>
          <h1 className="font-display font-extrabold text-3xl text-primary tracking-tight">
            Enterprise Search
          </h1>
        </div>
        <p className="text-sm text-text-secondary mt-1">
          Advanced search across skills, universities, applicants, and internships.
        </p>
      </div>

      <SearchPageClient />
    </div>
  );
}
