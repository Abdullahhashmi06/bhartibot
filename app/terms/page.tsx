import type { Metadata } from "next";
import LegalShell, {
  LegalSection,
  LegalSubheading,
  LegalParagraph,
  LegalList,
  LegalNote,
  LegalStrong,
} from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Service — InternIQ",
  description:
    "The terms and conditions that govern your use of the InternIQ AI-powered internship recruitment platform.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service — InternIQ",
    description:
      "The terms and conditions that govern your use of InternIQ.",
    type: "website",
    siteName: "InternIQ",
  },
};

export default function TermsOfServicePage() {
  return (
    <LegalShell page="terms" lastUpdated="August 4, 2026">
      <LegalSection id="acceptance" title="1. Acceptance of Terms">
        <LegalParagraph>
          By accessing or using InternIQ (“the Platform”), you agree to be
          bound by these Terms of Service and our{" "}
          <a
            href="/privacy"
            className="font-semibold text-teal-dark dark:text-teal-300 underline decoration-teal/40 underline-offset-2 hover:decoration-teal"
          >
            Privacy Policy
          </a>
          . If you do not agree to these terms, you may not use the Platform.
        </LegalParagraph>
        <LegalParagraph>
          The Platform is an AI-powered internship recruitment service
          connecting recruiters who post internship opportunities with
          applicants who apply for them.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="eligibility" title="2. Eligibility">
        <LegalList
          items={[
            <>
              You must be at least <LegalStrong>13 years of age</LegalStrong>{" "}
              to use the Platform.
            </>,
            <>
              You must provide <LegalStrong>accurate and truthful
              information</LegalStrong> when creating an account or submitting
              an application.
            </>,
            <>
              The Platform is intended for recruiters, employers, university
              students, and graduates seeking internships.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="accounts" title="3. Accounts">
        <LegalSubheading>3.1 General</LegalSubheading>
        <LegalParagraph>
          You are responsible for maintaining the confidentiality of your
          account credentials and for all activity that occurs under your
          account. Notify us immediately if you suspect unauthorized access.
        </LegalParagraph>

        <LegalSubheading>3.2 Recruiter Responsibilities</LegalSubheading>
        <LegalList
          items={[
            <>
              Post internships that are <LegalStrong>real, lawful, and
              accurately described</LegalStrong>.
            </>,
            <>
              Ensure you have the authority to represent the organization
              posting the internship.
            </>,
            <>
              Review candidates fairly and comply with applicable employment
              laws.
            </>,
            <>
              Remain responsible for all hiring decisions — AI outputs are
              assistance, not decisions.
            </>,
          ]}
        />

        <LegalSubheading>3.3 Applicant Responsibilities</LegalSubheading>
        <LegalList
          items={[
            <>
              Submit <LegalStrong>truthful and accurate</LegalStrong> personal
              information, resumes, and application responses.
            </>,
            <>
              Only submit applications for internships you genuinely intend to
              pursue.
            </>,
            <>
              Respect the confidentiality of any information shared during the
              recruitment process.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="acceptable-use" title="4. Acceptable Use">
        <LegalParagraph>
          You agree to use the Platform only for lawful purposes and in a way
          that does not infringe the rights of, or restrict the use of the
          Platform by, any third party.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="prohibited" title="5. Prohibited Activities">
        <LegalParagraph>
          You may not use the Platform to engage in, facilitate, or encourage
          any of the following:
        </LegalParagraph>
        <LegalList
          items={[
            <>Posting <LegalStrong>fake or fraudulent internships</LegalStrong>.</>,
            <>Submitting <LegalStrong>fake or fabricated resumes</LegalStrong> or credentials.</>,
            <>Sending <LegalStrong>spam</LegalStrong>, unsolicited messages, or bulk communications.</>,
            <>Harassing, threatening, or intimidating other users.</>,
            <><LegalStrong>Impersonating</LegalStrong> any person or organization.</>,
            <>Uploading <LegalStrong>malicious files</LegalStrong>, malware, or content designed to harm the Platform or its users.</>,
            <>Posting <LegalStrong>illegal content</LegalStrong> or content that violates the rights of others.</>,
            <><LegalStrong>Scraping</LegalStrong>, data mining, or harvesting content from the Platform without authorization.</>,
            <><LegalStrong>Reverse engineering</LegalStrong>, decompiling, or attempting to extract the source code of the Platform.</>,
            <>Attempting to gain <LegalStrong>unauthorized access</LegalStrong> to the Platform, other users&apos; accounts, or our systems.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="ai-abuse" title="6. AI Use &amp; Abuse">
        <LegalList
          items={[
            <>
              <LegalStrong>AI-generated content</LegalStrong> such as
              internship descriptions, interview questions, and candidate
              analyses is provided as a tool to assist users. You are
              responsible for reviewing and verifying AI outputs before relying
              on them.
            </>,
            <>
              <LegalStrong>Recruiters remain responsible</LegalStrong> for all
              hiring decisions made using the Platform, including decisions
              informed by AI-generated analysis.
            </>,
            <>
              <LegalStrong>Applicants remain responsible</LegalStrong> for the
              accuracy and truthfulness of all information they submit,
              including resumes, profiles, and screening responses.
            </>,
            <>
              You may not use the Platform&apos;s AI features to generate,
              process, or distribute illegal, harmful, or discriminatory
              content, or to attempt to extract or reconstruct data that
              belongs to other users or organizations.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="internships" title="7. Internships">
        <LegalParagraph>
          InternIQ is a platform that <LegalStrong>facilitates
          connections</LegalStrong> between recruiters and applicants.
        </LegalParagraph>
        <LegalList
          items={[
            <>
              InternIQ does <LegalStrong>not verify every internship</LegalStrong>{" "}
              posted on the Platform.
            </>,
            <>
              <LegalStrong>Recruiters are solely responsible</LegalStrong> for
              the internships they post, including the accuracy of the
              description and the legitimacy of the opportunity.
            </>,
            <>
              Applicants are encouraged to exercise judgment and verify
              opportunities before sharing personal information or committing
              to an internship.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="applications" title="8. Applications">
        <LegalParagraph>
          <LegalStrong>Applicants are responsible</LegalStrong> for the
          accuracy, completeness, and truthfulness of every application they
          submit, including any resume, responses to screening questions, and
          profile information. Submitting false information may result in the
          rejection of an application or termination of an account.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="emails" title="9. Email Communications">
        <LegalParagraph>
          As part of using the Platform, you may receive transactional email
          communications, including:
        </LegalParagraph>
        <LegalList
          items={[
            <>One-time passcodes (OTP) for secure sign-in and verification.</>,
            <>Password reset emails.</>,
            <>Interview invitations and scheduling notifications.</>,
            <>Application status updates (e.g., shortlisted, rejected, offer).</>,
          ]}
        />
        <LegalParagraph>
          You agree to receive these service-related emails as an integral part
          of using the Platform. We do not send promotional or advertising
          emails without your consent.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="ip" title="10. Intellectual Property">
        <LegalList
          items={[
            <>
              <LegalStrong>Platform ownership:</LegalStrong> the InternIQ name,
              logo, branding, software, design, and AI technology are owned by
              InternIQ and its licensors. You may not copy, modify, or
              redistribute them without permission.
            </>,
            <>
              <LegalStrong>User content:</LegalStrong> you retain ownership of
              the content you upload and submit. By uploading content, you
              grant InternIQ a limited license to store, process, and display
              it solely to provide the Platform&apos;s services to you and the
              users you interact with.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="termination" title="11. Termination">
        <LegalList
          items={[
            <>
              We may <LegalStrong>suspend or terminate accounts</LegalStrong>{" "}
              that violate these Terms or engage in abusive, fraudulent, or
              unlawful activity.
            </>,
            <>
              You may delete your account at any time. Upon termination, your
              access to the Platform ends, and we will handle your data in
              accordance with our Privacy Policy.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="disclaimer" title="12. Disclaimer">
        <LegalList
          items={[
            <>
              The Platform is provided <LegalStrong>“as is”</LegalStrong> and
              “as available,” without warranties of any kind, express or
              implied.
            </>,
            <>
              InternIQ does not <LegalStrong>guarantee employment</LegalStrong>{" "}
              or any specific hiring outcome for applicants or recruiters.
            </>,
            <>
              InternIQ does not guarantee that <LegalStrong>every AI
              output</LegalStrong> is accurate, complete, or error-free. AI
              analysis is probabilistic and may contain inaccuracies.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="liability" title="13. Limitation of Liability">
        <LegalParagraph>
          To the maximum extent permitted by applicable law, InternIQ and its
          officers, employees, and agents shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages, or for any
          loss of profits, data, or opportunities, arising out of or related to
          your use of the Platform, even if advised of the possibility of such
          damages.
        </LegalParagraph>
        <LegalParagraph>
          Nothing in these Terms limits liability that cannot be limited under
          applicable law.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="changes-to-terms" title="14. Changes to These Terms">
        <LegalParagraph>
          We may update these Terms from time to time. Material changes will be
          reflected by updating the “Last updated” date above. Your continued
          use of the Platform after changes take effect constitutes acceptance
          of the revised Terms.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="contact" title="15. Contact">
        <LegalParagraph>
          For questions about these Terms, please use the{" "}
          <a
            href="/contact"
            className="font-semibold text-teal-dark dark:text-teal-300 underline decoration-teal/40 underline-offset-2 hover:decoration-teal"
          >
            contact form
          </a>{" "}
          on our website.
        </LegalParagraph>
        <LegalNote>
          <LegalStrong>InternIQ</LegalStrong>
          <br />
          Reach our team through the contact form on our website.
        </LegalNote>
      </LegalSection>
    </LegalShell>
  );
}
