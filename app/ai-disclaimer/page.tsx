import type { Metadata } from "next";
import LegalShell, {
  LegalSection,
  LegalParagraph,
  LegalList,
  LegalNote,
  LegalStrong,
} from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Responsible AI Disclaimer — InternIQ",
  description:
    "How InternIQ uses artificial intelligence responsibly, what AI can and cannot do, and the importance of human review in every hiring decision.",
  alternates: { canonical: "/ai-disclaimer" },
  openGraph: {
    title: "Responsible AI Disclaimer — InternIQ",
    description:
      "How InternIQ uses AI responsibly in the recruitment process.",
    type: "website",
    siteName: "InternIQ",
  },
};

export default function AiDisclaimerPage() {
  return (
    <LegalShell page="ai" lastUpdated="August 4, 2026">
      <LegalSection id="how-we-use-ai" title="1. How InternIQ Uses AI">
        <LegalParagraph>
          InternIQ integrates artificial intelligence to make recruitment
          faster, fairer, and more transparent. AI is used to assist recruiters
          with:
        </LegalParagraph>
        <LegalList
          items={[
            <>
              <LegalStrong>Internship descriptions</LegalStrong> — drafting and
              refining role descriptions and requirements.
            </>,
            <>
              <LegalStrong>Interview questions</LegalStrong> — generating
              role-specific screening and interview questions.
            </>,
            <>
              <LegalStrong>Resume analysis</LegalStrong> — extracting skills,
              education, and experience from uploaded resumes.
            </>,
            <>
              <LegalStrong>Candidate summaries</LegalStrong> — summarizing an
              applicant&apos;s qualifications against a role.
            </>,
            <>
              <LegalStrong>Screening suggestions</LegalStrong> — match scoring
              and shortlisting recommendations based on stated requirements.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="ai-is-an-assistant" title="2. AI Is an Assistant — Not a Decision-Maker">
        <LegalNote>
          <LegalStrong>Important:</LegalStrong> AI is a{" "}
          <LegalStrong>decision support tool</LegalStrong>, not a hiring
          decision-maker. Every automated output is an assistive suggestion,
          never a final verdict.
        </LegalNote>
        <LegalList
          items={[
            <>
              <LegalStrong>Recruiters must review AI outputs</LegalStrong>{" "}
              before acting on them. Final hiring decisions — shortlisting,
              interviewing, offering — belong to the recruiter and their
              organization.
            </>,
            <>
              <LegalStrong>Applicants should not assume AI scores are
              final</LegalStrong>. A match score or analysis is one input among
              many and can be incomplete or imperfect.
            </>,
            <>
              AI outputs never override human judgment, legal requirements, or
              organizational policies.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="possible-inaccuracies" title="3. Possible Inaccuracies">
        <LegalParagraph>
          Like all AI systems, InternIQ&apos;s features can be imperfect. You
          should be aware of the following possibilities:
        </LegalParagraph>
        <LegalList
          items={[
            <>
              <LegalStrong>Bias:</LegalStrong> AI models may reflect biases
              present in their training data, which can affect analyses and
              suggestions.
            </>,
            <>
              <LegalStrong>Hallucinations:</LegalStrong> AI may occasionally
              generate plausible-sounding but incorrect information.
            </>,
            <>
              <LegalStrong>Incomplete analysis:</LegalStrong> parsing and
              analysis may miss context, nuance, or details, especially with
              complex or unusual resumes.
            </>,
            <>
              <LegalStrong>False positives:</LegalStrong> a candidate may be
              suggested as a strong match when they are not.
            </>,
            <>
              <LegalStrong>False negatives:</LegalStrong> a strong candidate may
              receive a low score or be missed entirely.
            </>,
          ]}
        />
        <LegalParagraph>
          AI analysis is probabilistic. It should be treated as a starting
          point for review, not as ground truth.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="recommendations" title="4. Recommendations Are Suggestions">
        <LegalList
          items={[
            <>
              Match scores, rankings, and shortlist suggestions are{" "}
              <LegalStrong>recommendations</LegalStrong>, not instructions.
            </>,
            <>
              <LegalStrong>Human review is always recommended</LegalStrong>{" "}
              before any decision that affects a candidate&apos;s
              opportunities.
            </>,
            <>
              Recruiters should independently verify qualifications,
              credentials, and fit using the original application materials.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="privacy-and-ai" title="5. Privacy and AI Processing">
        <LegalList
          items={[
            <>
              <LegalStrong>AI processing only occurs when needed</LegalStrong>{" "}
              — to generate the specific analysis or recommendation you
              requested.
            </>,
            <>
              Only the information required for the task is used, and we
              minimize the personal data sent to AI providers.
            </>,
            <>
              We do not use AI to make automated hiring decisions on behalf of
              organizations without human involvement.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="no-guarantees" title="6. No Guarantee of Perfect Outputs">
        <LegalParagraph>
          InternIQ makes <LegalStrong>no guarantee</LegalStrong> that AI
          outputs are accurate, complete, unbiased, or suitable for any
          particular purpose. To the fullest extent permitted by law, InternIQ
          is not liable for decisions made or actions taken based on AI
          outputs.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="continuous-improvement" title="7. Continuous Improvement">
        <LegalParagraph>
          We are committed to responsible AI. InternIQ continuously works to:
        </LegalParagraph>
        <LegalList
          items={[
            <>Improve the accuracy and reliability of AI features.</>,
            <>Reduce the risk of bias and harmful outputs.</>,
            <>Make AI behavior more transparent and explainable.</>,
            <>Give users control and visibility over how AI is used.</>,
          ]}
        />
        <LegalParagraph>
          We welcome feedback from both recruiters and applicants to help us
          improve. Contact us at{" "}
          <a
            href="mailto:interniq26@gmail.com"
            className="font-semibold text-teal-dark dark:text-teal-300"
          >
            interniq26@gmail.com
          </a>
          .
        </LegalParagraph>
      </LegalSection>
    </LegalShell>
  );
}
