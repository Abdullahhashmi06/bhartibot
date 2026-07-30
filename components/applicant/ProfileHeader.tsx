"use client";

import { useState } from "react";
import { getAvatarUrl } from "@/lib/utils";
import { MapPin, Mail, Phone, Link as LinkIcon, Github, Linkedin, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ProfileHeader({ profile }: { profile: any }) {
  const avatarUrl = getAvatarUrl(profile?.full_name || "User");
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-card border border-border dark:border-slate-700 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-primary opacity-10"></div>
      
      <div className="relative flex flex-col md:flex-row gap-8 items-start md:items-center mt-8">
        <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-2xl shadow-teal border-4 border-white bg-white" />
        
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-primary dark:text-white">{profile?.full_name || "Complete Your Profile"}</h1>
              <p className="text-text-secondary dark:text-slate-400 mt-1 max-w-xl">{profile?.bio || "Add a short bio about yourself to stand out to recruiters."}</p>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-text-secondary">
            {profile?.email && (
              <div className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-teal" /> {profile.email}</div>
            )}
            {profile?.location && (
              <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-teal" /> {profile.location}</div>
            )}
            {profile?.phone && (
              <div className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-teal" /> {profile.phone}</div>
            )}
          </div>
          
          <div className="mt-4 flex flex-wrap gap-3">
            {profile?.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#0A66C2] transition-colors"><Linkedin className="w-5 h-5" /></a>
            )}
            {profile?.github_url && (
              <a href={profile.github_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors"><Github className="w-5 h-5" /></a>
            )}
            {profile?.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-teal transition-colors"><LinkIcon className="w-5 h-5" /></a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
