"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import FormNotice from "@/components/ui/FormNotice";
import { Input } from "@/components/ui/Input";
import { submitContactMessage } from "@/app/contact/actions";
import { getRecaptchaToken } from "@/lib/recaptcha/client";

interface FieldErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Your name is required.";
    if (!email.trim()) {
      next.email = "Your email is required.";
    } else if (!isValidEmail(email)) {
      next.email = "Please enter a valid email address.";
    }
    if (!subject.trim()) next.subject = "A subject is required.";
    if (!message.trim()) {
      next.message = "Please write a short message.";
    } else if (message.trim().length < 10) {
      next.message = "Please write at least 10 characters so we can help.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const token = await getRecaptchaToken("contact");
      const res = await submitContactMessage({
        name,
        email,
        subject,
        message,
        token: token ?? undefined,
      });
      setResult(res);
      if (res.success) {
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      }
    } catch (err) {
      setResult({
        success: false,
        message: "Something went wrong while sending your message. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-card space-y-5"
      noValidate
    >
      <div className="flex items-center gap-2 border-b border-border dark:border-slate-700 pb-4">
        <Send className="h-5 w-5 text-teal" />
        <h2 className="font-display font-bold text-lg text-primary dark:text-white">
          Send us a message
        </h2>
      </div>

      {result && (
        <FormNotice tone={result.success ? "success" : "error"}>
          {result.success ? (
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> {result.message}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {result.message}
            </span>
          )}
        </FormNotice>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Name"
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          maxLength={120}
          required
        />
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          maxLength={254}
          required
        />
      </div>

      <Input
        label="Subject"
        placeholder="How can we help?"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        error={errors.subject}
        maxLength={200}
        required
      />

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-text-primary dark:text-slate-200">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Write your question or feedback here..."
          maxLength={5000}
          required
          aria-invalid={errors.message ? "true" : undefined}
          className={`w-full rounded-xl border bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-text-primary dark:text-slate-100 placeholder:text-text-muted dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all duration-150 ${
            errors.message
              ? "border-danger focus:ring-danger/30 focus:border-danger"
              : "border-border dark:border-slate-700"
          }`}
        />
        {errors.message && (
          <p className="text-xs font-medium text-danger" role="alert">
            {errors.message}
          </p>
        )}
        <p className="text-[11px] text-text-muted">
          {message.length}/5000 characters
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          variant="gradient"
          size="md"
          isLoading={isSubmitting}
          leftIcon={<Send className="h-4 w-4" />}
        >
          Send Message
        </Button>
      </div>
    </form>
  );
}
