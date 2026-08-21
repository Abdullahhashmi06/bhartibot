"use client"
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

export default function ComparisonToolbar({ count }: { count: number }) {
  const router = useRouter();
  
  const handleExport = () => {
    toast.info("Export to PDF feature coming soon!");
  };

  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between shadow-sm dark:bg-[#0F1729]/85 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-teal-light rounded-full transition-colors text-text-secondary hover:text-teal-dark dark:hover:bg-teal/15"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-display font-semibold text-primary">
          Comparing {count} Candidates
        </h1>
      </div>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-border text-primary font-medium rounded-lg hover:border-teal hover:text-teal-dark hover:shadow-sm transition-all dark:bg-[#1A2438] dark:border-slate-700"
      >
        <Download className="w-4 h-4" />
        Export PDF
      </button>
    </div>
  );
}
