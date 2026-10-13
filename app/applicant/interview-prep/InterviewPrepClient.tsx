"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, MessageSquareText } from "lucide-react";

const templates = [
  { category: "Introduction", question: "Tell me about yourself and what brings you to this role.", guide: "Connect your current studies or experience to two relevant strengths, then explain why this role is a natural next step." },
  { category: "Motivation", question: "Why are you interested in this company and position?", guide: "Mention a specific product, team, or company goal, then link it to what you want to learn or contribute." },
  { category: "Examples", question: "Describe a project you are proud of. What was your contribution?", guide: "Set the context, explain your personal actions, and share a measurable result or lesson." },
  { category: "Problem solving", question: "Tell me about a difficult problem you worked through.", guide: "Explain how you broke the problem down, what options you considered, and what you would improve next time." },
  { category: "Teamwork", question: "Tell me about a time you disagreed with a teammate.", guide: "Focus on listening, how you resolved the disagreement, and what the team achieved." },
  { category: "Learning", question: "What is a skill you are currently working to improve?", guide: "Name a specific skill, the steps you are taking, and how you will know you are making progress." },
  { category: "Technical", question: "How do you approach learning an unfamiliar technology?", guide: "Describe a practical process: understand the goal, read trusted documentation, build a small example, and ask for feedback." },
  { category: "Wrap up", question: "What questions do you have for us?", guide: "Ask about the team's current priorities, mentorship, success measures, or what a typical week looks like." },
];

export default function InterviewPrepPage() {
  const [open, setOpen] = useState<number | null>(null);
  const questions = useMemo(() => templates, []);
  return <div className="mx-auto max-w-4xl space-y-5">
    <header><p className="text-xs font-semibold uppercase tracking-wide text-teal">Practice mode</p><h1 className="mt-1 text-2xl font-bold text-primary dark:text-white">Interview questions</h1><p className="mt-1 text-sm text-text-secondary">Practice common internship interview questions. Open a prompt for a concise answer outline.</p></header>
    <div className="space-y-2">{questions.map((item, index) => <section key={item.category} className="rounded-xl border border-border bg-white dark:bg-slate-800"><button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => setOpen(open === index ? null : index)}><MessageSquareText className="h-4 w-4 shrink-0 text-teal"/><span className="min-w-0 flex-1"><span className="block text-[11px] font-medium uppercase tracking-wide text-text-muted">{item.category}</span><span className="mt-0.5 block text-sm font-medium text-primary dark:text-white">{item.question}</span></span>{open === index ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}</button>{open === index && <p className="border-t border-border px-4 py-3 pl-11 text-sm leading-relaxed text-text-secondary">{item.guide}</p>}</section>)}</div>
  </div>;
}
