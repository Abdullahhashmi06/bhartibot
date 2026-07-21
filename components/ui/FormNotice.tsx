type Tone = "error" | "info";

const toneStyles: Record<Tone, string> = {
  error: "border-rose/40 bg-rose/10 text-[#8A3A20]",
  info: "border-teal/40 bg-teal/10 text-[#1D6E63]",
};

export default function FormNotice({
  tone = "error",
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={`rounded-md border px-3 py-2 text-sm ${toneStyles[tone]}`}
    >
      {children}
    </div>
  );
}
