"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, GraduationCap, Link2, UploadCloud, FileText, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import FormNotice from "@/components/ui/FormNotice";
import { createClient } from "@/lib/supabase/client";
import { createApplication } from "@/lib/queries/applications";
import { ScreeningQuestion } from "@/lib/types";
import { uploadCv } from "@/lib/queries/storage";

const inputClass =
  "w-full rounded-xl border border-border bg-slate-50/50 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-teal focus:bg-white focus:outline-none transition-all shadow-subtle";

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
      setError("Full Name and Email address are required.");
      return;
    }

    if (cvFile && cvFile.type !== "application/pdf") {
      setError("CV must be a valid PDF document.");
      return;
    }

    for (const question of questions) {
      if (!answers[question.id]?.trim()) {
        setError("Please answer all screening questions before submitting.");
        return;
      }
    }

    setStatus("submitting");

    let cvPath: string | undefined;

    if (cvFile) {
      const { path, error } = await uploadCv(supabase, cvFile);

      if (error || !path) {
        setStatus("idle");
        setError(error ?? "Failed to upload CV file.");
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
      setError(submitError);
      return;
    }

    if (submitError) {
      setError(submitError);
      return;
    }

    router.push(`/apply/${slug}/success`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && <FormNotice tone="error">{error}</FormNotice>}

      {/* SECTION 1: PERSONAL INFORMATION */}
      <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <User className="h-5 w-5 text-teal" />
          <h2 className="font-display font-bold text-lg text-primary">
            Personal Information
          </h2>
        </div>

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
          <Field label="Email Address" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ayesha@university.edu"
              className={inputClass}
            />
          </Field>
          <Field label="Phone Number">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+92 300 1234567"
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      {/* SECTION 2: ACADEMIC BACKGROUND */}
      <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <GraduationCap className="h-5 w-5 text-purple-ai" />
          <h2 className="font-display font-bold text-lg text-primary">
            Academic Background
          </h2>
        </div>

        <Field label="University / College Name">
          <input
            type="text"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="National University of Sciences and Technology"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Degree Program">
            <input
              type="text"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="BS Computer Science"
              className={inputClass}
            />
          </Field>
          <Field label="Current Semester">
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
              placeholder="3.85"
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      {/* SECTION 3: PROFESSIONAL LINKS */}
      <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Link2 className="h-5 w-5 text-emerald" />
          <h2 className="font-display font-bold text-lg text-primary">
            Professional Links (Optional)
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="LinkedIn Profile">
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className={inputClass}
            />
          </Field>
          <Field label="GitHub Profile">
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              className={inputClass}
            />
          </Field>
          <Field label="Portfolio Website">
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://yourportfolio.com"
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      {/* SECTION 4: RESUME / CV PDF UPLOADER */}
      <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <UploadCloud className="h-5 w-5 text-teal" />
          <h2 className="font-display font-bold text-lg text-primary">
            Upload PDF Resume / CV
          </h2>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-border bg-slate-50/50 p-6 text-center space-y-3 hover:border-teal transition-all">
          <FileText className="h-10 w-10 text-teal mx-auto" />
          <div>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
              className="hidden"
              id="cv-upload-input"
            />
            <label
              htmlFor="cv-upload-input"
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 py-2.5 text-xs font-semibold shadow-subtle hover:bg-primary-light transition-all"
            >
              <UploadCloud className="h-4 w-4" /> Choose PDF File
            </label>
          </div>
          {cvFile ? (
            <p className="font-mono text-xs font-bold text-teal-dark">
              Selected: {cvFile.name} ({(cvFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          ) : (
            <p className="text-xs text-text-muted">
              Only PDF format is supported. Maximum file size 10MB.
            </p>
          )}
        </div>
      </div>

      {/* SECTION 5: SCREENING QUESTIONS */}
      {questions.length > 0 && (
        <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-5">
          <div className="border-b border-border pb-3">
            <h2 className="font-display font-bold text-lg text-primary">
              Screening Questions ({questions.length})
            </h2>
            <p className="text-xs text-text-secondary">
              Please answer the following role-specific questions.
            </p>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-2xl border border-border bg-slate-50 p-4 space-y-3 shadow-subtle"
              >
                <p className="font-display font-semibold text-sm text-primary">
                  {index + 1}. {question.question}
                </p>

                {question.type === "YES_NO" ? (
                  <div className="flex gap-3">
                    {(["Yes", "No"] as const).map((option) => (
                      <label
                        key={option}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all ${
                          answers[question.id] === option
                            ? "border-teal bg-teal-light text-teal-dark shadow-subtle"
                            : "border-border bg-white text-text-primary hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          checked={answers[question.id] === option}
                          onChange={() =>
                            handleAnswerChange(question.id, option)
                          }
                          className="mt-0.5"
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
                    placeholder="Type your response here..."
                    className={inputClass}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        isLoading={status === "submitting"}
        className="w-full py-3.5"
        leftIcon={<Send className="h-4 w-4" />}
      >
        Submit Application
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
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-text-primary">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children}
    </div>
  );
}
