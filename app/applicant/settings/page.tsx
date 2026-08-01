"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { User, Lock, Trash2, Save, Info, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import {
  APP_VERSION,
  BUILD_ID,
  formatBuildDate,
} from "@/lib/version";
import {
  getNotificationPermission,
  ensureNotificationPermission,
} from "@/lib/pwa/sw-register";

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase.from("applicant_profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) setProfile(data);
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("applicant_profiles").update({
        full_name: profile.full_name,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        github_url: profile.github_url,
        linkedin_url: profile.linkedin_url,
        portfolio_url: profile.portfolio_url
      }).eq("id", user.id);

      if (error) throw error;
      toast.success("Settings saved successfully!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-display font-bold text-primary dark:text-white">Account Settings</h1>
        <p className="text-text-secondary dark:text-slate-400 mt-1">Manage your personal information and preferences.</p>
      </div>

      {/* App Information Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-card border border-border dark:border-slate-700">
        <h2 className="text-xl font-display font-bold text-primary dark:text-white mb-6 flex items-center gap-2">
          <Info className="w-5 h-5 text-teal" /> App Information
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-border dark:border-slate-600 p-4 text-center">
            <span className="font-mono text-[10px] text-text-muted uppercase block">Version</span>
            <span className="font-display font-bold text-lg text-primary dark:text-white">{APP_VERSION}</span>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-border dark:border-slate-600 p-4 text-center">
            <span className="font-mono text-[10px] text-text-muted uppercase block">Build</span>
            <span className="font-mono font-bold text-sm text-teal-dark dark:text-teal truncate">{BUILD_ID}</span>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-border dark:border-slate-600 p-4 text-center col-span-2">
            <span className="font-mono text-[10px] text-text-muted uppercase block">Deployed</span>
            <span className="font-mono font-bold text-xs text-primary dark:text-white">{formatBuildDate()}</span>
          </div>
        </div>
        <p className="text-[11px] text-text-muted mt-4 font-mono">
          InternIQ PWA · Installable · Offline-ready
        </p>
      </div>

      {/* Notifications Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-card border border-border dark:border-slate-700">
        <h2 className="text-xl font-display font-bold text-primary dark:text-white mb-2 flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal" /> Notifications
        </h2>
        <p className="text-xs text-text-secondary mb-4">
          Get notified about application status updates, interview reminders and offers.
        </p>
        <NotificationGate />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-card border border-border dark:border-slate-700">
        <h2 className="text-xl font-display font-bold text-primary dark:text-white mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-teal" /> Personal Information
        </h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-text-secondary mb-1.5 block">Full Name</label>
              <input type="text" value={profile.full_name || ""} onChange={e => setProfile({...profile, full_name: e.target.value})} className="w-full p-3 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-1.5 block">Email Address (Read Only)</label>
              <input type="email" value={profile.email || ""} disabled className="w-full p-3 rounded-xl border border-border dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-1.5 block">Phone Number</label>
              <input type="tel" value={profile.phone || ""} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full p-3 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-1.5 block">Location</label>
              <input type="text" value={profile.location || ""} onChange={e => setProfile({...profile, location: e.target.value})} className="w-full p-3 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" placeholder="City, Country" />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-1.5 block">Bio</label>
            <textarea value={profile.bio || ""} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full p-3 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" rows={3} placeholder="A short bio about yourself..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-1.5 block">GitHub Profile</label>
              <input type="url" value={profile.github_url || ""} onChange={e => setProfile({...profile, github_url: e.target.value})} className="w-full p-3 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" placeholder="https://github.com/..." />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-1.5 block">LinkedIn Profile</label>
              <input type="url" value={profile.linkedin_url || ""} onChange={e => setProfile({...profile, linkedin_url: e.target.value})} className="w-full p-3 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <label className="text-sm font-medium text-text-secondary dark:text-slate-400 mb-1.5 block">Portfolio Website</label>
              <input type="url" value={profile.portfolio_url || ""} onChange={e => setProfile({...profile, portfolio_url: e.target.value})} className="w-full p-3 rounded-xl border border-border dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white" placeholder="https://..." />
            </div>
          </div>

          <div className="pt-4 border-t border-border dark:border-slate-700 flex justify-end">
            <Button variant="gradient" onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-card border border-rose-100 dark:border-rose-900/30">
        <h2 className="text-xl font-display font-bold text-rose-600 mb-6 flex items-center gap-2">
          <Trash2 className="w-5 h-5" /> Danger Zone
        </h2>
        <p className="text-text-secondary mb-6">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300">
          Delete Account
        </Button>
      </div>
    </div>
  );
}

function NotificationGate() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const enable = async () => {
    setBusy(true);
    const p = await ensureNotificationPermission();
    setPermission(p);
    setBusy(false);
    if (p === "granted") toast.success("Notifications enabled!");
  };

  if (permission === null) return null;
  if (permission === "unsupported") {
    return (
      <p className="text-xs text-text-muted">
        Notifications aren&apos;t supported in this browser.
      </p>
    );
  }

  const granted = permission === "granted";

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <p className="text-xs text-text-secondary">
        Status:{" "}
        <span className={`font-semibold ${granted ? "text-emerald-dark dark:text-emerald" : "text-warning"}`}>
          {granted ? "Enabled" : permission === "denied" ? "Blocked" : "Not enabled"}
        </span>
      </p>
      {!granted && (
        <Button variant="gradient" size="sm" onClick={enable} disabled={busy}>
          {busy ? "Requesting..." : permission === "denied" ? "Re-enable in Browser Settings" : "Enable Notifications"}
        </Button>
      )}
    </div>
  );
}
