"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, Save, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function addUnique(items: string[], value: string) {
  const clean = value.trim();
  return clean && !items.some((item) => item.toLowerCase() === clean.toLowerCase())
    ? [...items, clean]
    : items;
}

export default function ApplicantPreferencesPage() {
  const supabase = createClient();
  const [companies, setCompanies] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const metadata = data.user?.user_metadata ?? {};
      setCompanies(Array.isArray(metadata.desired_companies) ? metadata.desired_companies : []);
      setSkills(Array.isArray(metadata.target_skills) ? metadata.target_skills : []);
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { desired_companies: companies, target_skills: skills },
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Job preferences saved");
  }

  function addItem(kind: "company" | "skill") {
    if (kind === "company") {
      setCompanies((current) => addUnique(current, companyInput));
      setCompanyInput("");
    } else {
      setSkills((current) => addUnique(current, skillInput));
      setSkillInput("");
    }
  }

  if (loading) return <p className="p-8 text-sm text-text-muted">Loading preferences…</p>;

  const editor = (label: string, placeholder: string, value: string, setter: (value: string) => void, items: string[], remove: (item: string) => void, kind: "company" | "skill") => (
    <section className="rounded-2xl border border-border bg-white p-5 dark:bg-slate-800">
      <h2 className="font-semibold text-primary dark:text-white">{label}</h2>
      <div className="mt-3 flex gap-2">
        <input className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900" value={value} onChange={(event) => setter(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addItem(kind); } }} placeholder={placeholder} />
        <button type="button" onClick={() => addItem(kind)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"><Plus className="h-4 w-4" /> Add</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => <span key={item} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200">{item}<button type="button" aria-label={`Remove ${item}`} onClick={() => remove(item)}><X className="h-3 w-3" /></button></span>)}
        {!items.length && <p className="text-xs text-text-muted">No preferences added yet.</p>}
      </div>
    </section>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header><p className="text-xs font-semibold uppercase tracking-wide text-teal">Your targets</p><h1 className="mt-1 text-2xl font-bold text-primary dark:text-white">Companies & skills</h1><p className="mt-1 text-sm text-text-secondary">Set the companies and skills you want to focus on. These personalize your job matches and alerts.</p></header>
      {editor("Desired companies", "e.g. Microsoft", companyInput, setCompanyInput, companies, (item) => setCompanies((current) => current.filter((value) => value !== item)), "company")}
      {editor("Skills to learn or use", "e.g. React", skillInput, setSkillInput, skills, (item) => setSkills((current) => current.filter((value) => value !== item)), "skill")}
      <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Saving…" : "Save preferences"}</button>
    </div>
  );
}
