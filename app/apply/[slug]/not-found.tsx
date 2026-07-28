import Link from "next/link";
import Shell from "@/components/layout/Shell";

export default function ApplyNotFound() {
  return (
    <Shell>
      <div className="mx-auto flex max-w-lg flex-col gap-4 py-16 text-center">
        <h1 className="font-display text-2xl font-medium text-ink">
          Internship not found
        </h1>
        <p className="text-sm text-muted">
          This application link may be invalid, or the internship is no longer
          accepting applications.
        </p>
        <Link
          href="/"
          className="text-sm text-ink underline underline-offset-2 hover:no-underline"
        >
          Go to InternIQ home
        </Link>
      </div>
    </Shell>
  );
}
