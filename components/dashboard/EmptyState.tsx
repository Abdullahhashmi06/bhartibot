"use client";

import { motion } from "framer-motion";
import { ButtonLink } from "@/components/ui/Button";

type EmptyStateVariant = "no-internships" | "no-applicants" | "no-results" | "no-archived";

interface EmptyStateProps {
  variant: EmptyStateVariant;
  onClearFilters?: () => void;
}

// Premium SVG illustrations
function NoInternshipsIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="30" width="80" height="55" rx="8" fill="#E8FAF8" stroke="#17C6B5" strokeWidth="2"/>
      <rect x="35" y="20" width="50" height="18" rx="5" fill="#17C6B5" opacity="0.3"/>
      <rect x="45" y="14" width="30" height="12" rx="4" fill="#17C6B5" opacity="0.5"/>
      <rect x="30" y="48" width="60" height="6" rx="3" fill="#17C6B5" opacity="0.4"/>
      <rect x="30" y="60" width="45" height="5" rx="2.5" fill="#CBD5E1"/>
      <rect x="30" y="71" width="35" height="5" rx="2.5" fill="#CBD5E1"/>
      <circle cx="93" cy="27" r="14" fill="#6F52ED" opacity="0.15"/>
      <path d="M93 21 L93 27 M90 24 L96 24" stroke="#6F52ED" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="93" cy="27" r="14" stroke="#6F52ED" strokeWidth="1.5" strokeDasharray="4 3"/>
    </svg>
  );
}

function NoApplicantsIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="35" r="18" fill="#F0EEFE" stroke="#6F52ED" strokeWidth="2"/>
      <circle cx="60" cy="28" r="8" fill="#6F52ED" opacity="0.5"/>
      <path d="M40 65 C40 52 80 52 80 65" stroke="#6F52ED" strokeWidth="2.5" strokeLinecap="round" fill="#F0EEFE"/>
      <rect x="25" y="72" width="70" height="14" rx="7" fill="#E8FAF8"/>
      <path d="M40 79 L52 79 M58 79 L72 79 M78 79 L83 79" stroke="#17C6B5" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="95" cy="20" r="8" fill="#E8FAF8" stroke="#17C6B5" strokeWidth="1.5"/>
      <path d="M95 16 L95 20 M93 18 L97 18" stroke="#17C6B5" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function NoResultsIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="52" cy="44" r="26" fill="#FEF9EE" stroke="#F59E0B" strokeWidth="2"/>
      <circle cx="52" cy="44" r="18" fill="#FEF3C7"/>
      <path d="M44 36 L60 52 M60 36 L44 52" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M71 63 L88 80" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round"/>
      <rect x="15" y="20" width="24" height="5" rx="2.5" fill="#E2E8F0"/>
      <rect x="15" y="30" width="18" height="4" rx="2" fill="#E2E8F0"/>
      <rect x="80" y="30" width="20" height="4" rx="2" fill="#E2E8F0"/>
      <rect x="84" y="20" width="14" height="5" rx="2.5" fill="#E2E8F0"/>
    </svg>
  );
}

function NoArchivedIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="40" width="80" height="45" rx="8" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2"/>
      <rect x="15" y="30" width="90" height="16" rx="6" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5"/>
      <path d="M48 38 L72 38" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
      <path d="M44 55 L76 55 M44 65 L65 65" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round"/>
      <path d="M50 77 L70 77" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round"/>
      <path d="M51 15 L60 8 L69 15" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M60 8 L60 25" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

const illustrations = {
  "no-internships": { 
    Illustration: NoInternshipsIllustration,
    title: "No Internships Created Yet",
    description: "Create your first internship drive to start accepting PDF resumes and AI candidate scoring.",
    action: (onClear?: () => void) => (
      <ButtonLink href="/dashboard/create-internship" variant="gradient">
        Create Internship Drive
      </ButtonLink>
    ),
  },
  "no-applicants": { 
    Illustration: NoApplicantsIllustration,
    title: "No Applicants Yet",
    description: "Share your public application link to start receiving candidates.",
    action: () => null,
  },
  "no-results": {
    Illustration: NoResultsIllustration,
    title: "No Results Found",
    description: "We couldn't find any internships matching your current filters and search term.",
    action: (onClear?: () => void) => (
      <button 
        onClick={onClear}
        className="text-sm font-semibold text-teal hover:text-teal-dark transition-colors"
      >
        Clear all filters
      </button>
    ),
  },
  "no-archived": {
    Illustration: NoArchivedIllustration,
    title: "No Archived Internships",
    description: "When you archive an internship, it will appear here.",
    action: () => null,
  }
};

export default function EmptyState({ variant, onClearFilters }: EmptyStateProps) {
  const { Illustration, title, description, action } = illustrations[variant];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-border bg-white py-20 px-6 text-center shadow-subtle"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
      >
        <Illustration />
      </motion.div>
      <div className="max-w-md space-y-1.5">
        <h3 className="font-display font-bold text-lg text-primary">
          {title}
        </h3>
        <p className="text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      </div>
      {action(onClearFilters) && (
        <div className="pt-1">
          {action(onClearFilters)}
        </div>
      )}
    </motion.div>
  );
}
