type TagTone = "neutral" | "amber" | "teal" | "rose";

const toneStyles: Record<TagTone, string> = {
  neutral: "bg-white text-muted border-border",
  amber: "bg-amber/10 text-[#8A5A16] border-amber/40",
  teal: "bg-teal/10 text-[#1D6E63] border-teal/40",
  rose: "bg-rose/10 text-[#8A3A20] border-rose/40",
};

export default function Tag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: TagTone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${toneStyles[tone]}`}
    >
      {children}
    </span>
  );
}
