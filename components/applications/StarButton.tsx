"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { toggleStar } from "@/lib/queries/star-candidates";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StarButtonProps {
  applicationId: string;
  recruiterId: string;
  initialStarred?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export default function StarButton({
  applicationId,
  recruiterId,
  initialStarred = false,
  className,
  size = "sm",
}: StarButtonProps) {
  const [starred, setStarred] = useState(initialStarred);
  const [isPending, setIsPending] = useState(false);
  const supabase = createClient();

  async function handleToggle() {
    if (isPending) return;
    setIsPending(true);
    const { starred: newState, error } = await toggleStar(supabase, recruiterId, applicationId);
    setIsPending(false);
    if (error) {
      toast.error("Failed to update star");
      return;
    }
    setStarred(newState);
    toast.success(newState ? "Candidate starred" : "Candidate unstarred");
  }

  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
  };

  return (
    <motion.button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleToggle();
      }}
      whileTap={{ scale: 0.8 }}
      className={cn(
        "inline-flex items-center justify-center rounded-lg p-1 transition-colors",
        starred
          ? "text-amber-400 hover:text-amber-500"
          : "text-text-muted hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20",
        isPending && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={starred ? "Unstar candidate" : "Star candidate"}
    >
      <motion.div
        key={starred ? "starred" : "unstarred"}
        initial={{ scale: 0.5, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <Star
          className={cn(
            sizeMap[size],
            starred ? "fill-amber-400" : "fill-none"
          )}
        />
      </motion.div>
    </motion.button>
  );
}
