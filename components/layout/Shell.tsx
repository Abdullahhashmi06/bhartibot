import Navbar from "./Navbar";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>
      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-5xl px-6 font-mono text-[11px] uppercase tracking-wider text-muted">
          BhartiBot · internal MVP build
        </div>
      </footer>
    </div>
  );
}
