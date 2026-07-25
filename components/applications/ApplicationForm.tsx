"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import FormNotice from "@/components/ui/FormNotice";
import { createClient } from "@/lib/supabase/client";
import { createApplication } from "@/lib/queries/applications";
import { ScreeningQuestion } from "@/lib/types";
import { uploadCv } from "@/lib/queries/storage";

const inputClass =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-muted/70 focus:border-ink";

export default function ApplicationForm({
  internshipId,
  slug,
  questions,
}: {
  internshipId: string;
  slug: string;
  questions: ScreeningQuestion[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [applicantName, setApplicantName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [semester, setSemester] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, ""]))
  );

  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [error, setError] = useState<string | null>(null);

  function handleAnswerChange(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!applicantName.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }

    if (cvFile && cvFile.type !== "application/pdf") {
      setError("CV must be a PDF file.");
      return;
    }

    for (const question of questions) {
      if (!answers[question.id]?.trim()) {
        setError("Please answer all screening questions.");
        return;
      }
    }

    setStatus("submitting");

    let cvPath: string | undefined;

    if (cvFile) {
      const { path, error } = await uploadCv(supabase, cvFile);

      if (error || !path) {
        setStatus("idle");
        setError(error ?? "Failed to upload CV.");
        return;
      }

      cvPath = path;
    }

    const { application, error: submitError } = await createApplication(
      supabase,
      {
        internship_id: internshipId,
        applicant_name: applicantName,
        email,
        phone,
        university,
        degree,
        semester,
        cgpa,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        portfolio_url: portfolioUrl,
        cv_path: cvPath,
        answers: questions.map((q) => ({
          question_id: q.id,
          answer: answers[q.id],
        })),
      }
    );

    setStatus("idle");

    if (submitError && !application) {
      setError(
        submitError.includes("row-level security")
          ? "Could not submit. Confirm the applications migration and RLS policies are applied (Developer B)."
          : submitError
      );
      return;
    }

    if (submitError) {
      setError(submitError);
      return;
    }

    router.push(`/apply/${slug}/success`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && <FormNotice tone="error">{error}</FormNotice>}

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-medium text-ink">
          Personal Information
        </h2>

        <Field label="Full Name" required>
          <input
            type="text"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            placeholder="Ayesha Khan"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ayesha@university.edu"
              className={inputClass}
            />
          </Field>
          <Field label="Phone">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 className="font-display text-lg font-medium text-ink">Education</h2>

        <Field label="University">
          <input
            type="text"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="National University of Sciences and Technology"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Degree">
            <input
              type="text"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="BS Computer Science"
              className={inputClass}
            />
          </Field>
          <Field label="Semester">
            <input
              type="text"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="6th"
              className={inputClass}
            />
          </Field>
          <Field label="CGPA">
            <input
              type="text"
              value={cgpa}
              onChange={(e) => setCgpa(e.target.value)}
              placeholder="3.45"
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 className="font-display text-lg font-medium text-ink">
          Professional Links
        </h2>
        <p className="text-sm text-muted">All optional.</p>

        <Field label="LinkedIn">
          <input
            type="url"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            placeholder="https://linkedin.com/in/yourprofile"
            className={inputClass}
          />
        </Field>

        <Field label="GitHub">
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/yourusername"
            className={inputClass}
          />
        </Field>

        <Field label="Portfolio">
          <input
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://yourportfolio.com"
            className={inputClass}
          />
        </Field>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 className="font-display text-lg font-medium text-ink">CV</h2>
        <Field label="Upload PDF CV">
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-text file:mr-3 file:rounded-md file:border file:border-border file:bg-paper file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink hover:file:border-ink"
          />
          <p className="mt-1.5 text-xs text-muted">
            PDF only. File storage is wired in Day 7 — your application details
            are saved now.
          </p>
        </Field>
      </section>

      {questions.length > 0 && (
        <section className="flex flex-col gap-4 border-t border-border pt-6">
          <h2 className="font-display text-lg font-medium text-ink">
            Screening Questions
          </h2>

          {questions.map((question, index) => (
            <div
              key={question.id}
              className="rounded-md border border-border bg-white p-4"
            >
              <p className="text-sm font-medium text-text">
                {index + 1}. {question.question}
              </p>

              {question.type === "yes_no" ? (
                <div className="mt-3 flex gap-4">
                  {(["Yes", "No"] as const).map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 text-sm text-text"
                    >
                      <input
                        type="radio"
                        name={`question_${question.id}`}
                        checked={answers[question.id] === option}
                        onChange={() =>
                          handleAnswerChange(question.id, option)
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answers[question.id]}
                  onChange={(e) =>
                    handleAnswerChange(question.id, e.target.value)
                  }
                  rows={3}
                  placeholder="Your answer"
                  className={`${inputClass} mt-3`}
                />
              )}
            </div>
          ))}
        </section>
      )}

      <Button type="submit" disabled={status === "submitting"} className="mt-2">
        {status === "submitting" ? "Submitting…" : "Submit Application"}
      </Button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text">
        {label}
        {required && <span className="text-rose"> *</span>}
      </span>
      {children}
    </label>
  );
}
