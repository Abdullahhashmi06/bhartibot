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
  title: "Privacy Policy — InternIQ",
  description:
    "How InternIQ collects, uses, protects, and handles your information when you use our AI-powered internship recruitment platform.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy — InternIQ",
    description:
      "How InternIQ collects, uses, protects, and handles your information.",
    type: "website",
    siteName: "InternIQ",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalShell
      page="privacy"
      lastUpdated="August 4, 2026"
    >
      <LegalSection id="introduction" title="1. Introduction">
        <LegalParagraph>
          <LegalStrong>InternIQ</LegalStrong> (“we,” “us,” or “our”) is an
          AI-powered internship recruitment platform that connects recruiters
          and applicants. This Privacy Policy explains how we collect, use,
          disclose, and safeguard your personal information when you visit our
          website or use our services.
        </LegalParagraph>
        <LegalParagraph>
          By creating an account or using InternIQ, you agree to the practices
          described in this policy. If you do not agree, please do not use the
          platform.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="information-we-collect" title="2. Information We Collect">
        <LegalSubheading>2.1 Personal Information</LegalSubheading>
        <LegalList
          items={[
            <>Email addresses used to create and identify your account.</>,
            <>Names (full name or display name).</>,
            <>
              Authentication information such as hashed passwords and
              authentication tokens.
            </>,
            <>
              Google OAuth data (your Google account email and public profile
              name) when you choose to sign in with Google.
            </>,
            <>
              Profile information you voluntarily add, such as education,
              skills, projects, experience, and certifications.
            </>,
            <>
              Resume/CV uploads, including the content of the documents you
              submit.
            </>,
            <>
              Internship information posted by recruiters, including
              descriptions, requirements, and screening questions.
            </>,
            <>
              Recruiter company information such as organization name and
              company details.
            </>,
          ]}
        />

        <LegalSubheading>2.2 Usage Information</LegalSubheading>
        <LegalList
          items={[
            <>
              Technical data such as device type, browser type, IP address, and
              operating system.
            </>,
            <>
              Usage data such as pages visited, features used, and interactions
              with the platform.
            </>,
            <>
              AI interactions, including requests made to AI features and the
              outputs generated in response.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="how-we-use-data" title="3. How We Use Your Data">
        <LegalList
          items={[
            <><LegalStrong>Account creation and management:</LegalStrong> to create and maintain your account.</>,
            <><LegalStrong>Authentication:</LegalStrong> to verify your identity and keep your account secure.</>,
            <><LegalStrong>Providing recruitment services:</LegalStrong> to let recruiters post internships, review applications, and let applicants apply and track their submissions.</>,
            <><LegalStrong>Improving AI:</LegalStrong> to generate AI-powered analyses, recommendations, and insights, and to improve the quality of these features.</>,
            <><LegalStrong>Communication:</LegalStrong> to respond to your inquiries and provide support.</>,
            <><LegalStrong>Email notifications:</LegalStrong> to send you account-related emails, including OTP codes, password resets, application status updates, and interview invitations.</>,
            <><LegalStrong>Security:</LegalStrong> to detect, prevent, and respond to fraud, abuse, and security incidents.</>,
            <><LegalStrong>Fraud prevention:</LegalStrong> to protect the integrity of the platform and its users.</>,
            <><LegalStrong>Legal compliance:</LegalStrong> to comply with applicable laws, regulations, and legal processes.</>,
          ]}
        />
      </LegalSection>

      <LegalSection id="google-authentication" title="4. Google Authentication">
        <LegalParagraph>
          InternIQ offers “Sign in with Google” as an authentication option.
          When you use it, Google shares your email address and public profile
          information with us.
        </LegalParagraph>
        <LegalList
          items={[
            <>
              OAuth is used <LegalStrong>only for authentication</LegalStrong>{" "}
              — we do not use Google&apos;s OAuth grant to access your Gmail,
              Drive, Contacts, or any other Google service.
            </>,
            <>
              <LegalStrong>We never receive or store your Google password.</LegalStrong>{" "}
              Passwords are handled entirely by Google during the OAuth flow.
            </>,
            <>
              You can revoke InternIQ&apos;s access to your Google account at
              any time through your Google Account settings.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="ai-processing" title="5. AI Processing">
        <LegalParagraph>
          InternIQ uses artificial intelligence to provide features such as
          resume analysis, internship descriptions, interview questions,
          candidate summaries, and screening suggestions.
        </LegalParagraph>
        <LegalList
          items={[
            <>
              AI-generated analysis may be processed through{" "}
              <LegalStrong>third-party AI providers</LegalStrong> to generate
              the results you see in the platform.
            </>,
            <>
              We do not intentionally send unnecessary personal information to
              AI providers. Only the information required to complete the
              specific analysis (for example, the resume text you asked us to
              analyze) is transmitted.
            </>,
            <>
              AI outputs are provided as assistance tools. They are not a
              substitute for professional judgment, and recruiters remain
              responsible for their hiring decisions. See our{" "}
              <a
                href="/ai-disclaimer"
                className="font-semibold text-teal-dark dark:text-teal-300 underline decoration-teal/40 underline-offset-2 hover:decoration-teal"
              >
                Responsible AI Disclaimer
              </a>
              .
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="storage" title="6. Data Storage">
        <LegalParagraph>
          Your data is stored securely on infrastructure provided by{" "}
          <LegalStrong>Supabase</LegalStrong>, which runs on reliable,
          encrypted cloud infrastructure.
        </LegalParagraph>
        <LegalList
          items={[
            <>
              <LegalStrong>Encrypted authentication:</LegalStrong> passwords are
              hashed and authentication is handled through secure, industry
              standard mechanisms.
            </>,
            <>
              <LegalStrong>Resume storage:</LegalStrong> uploaded CVs and
              resumes are stored in private storage with restricted access
              controls.
            </>,
            <>
              <LegalStrong>Data isolation:</LegalStrong> row-level security and
              organization scoping ensure users can only access data they are
              authorized to see.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="security" title="7. Security">
        <LegalParagraph>
          We take the security of your data seriously and implement multiple
          layers of protection:
        </LegalParagraph>
        <LegalList
          items={[
            <>
              <LegalStrong>RLS (Row-Level Security):</LegalStrong> database
              policies that restrict data access to authorized users and
              organizations.
            </>,
            <>
              <LegalStrong>Authentication:</LegalStrong> email/password,
              Google OAuth, and OTP-based verification for secure account
              access.
            </>,
            <>
              <LegalStrong>reCAPTCHA:</LegalStrong> bot protection on
              authentication and public form endpoints.
            </>,
            <>
              <LegalStrong>Email security:</LegalStrong> transactional emails
              are sent over authenticated SMTP with no sensitive content logged
              insecurely.
            </>,
            <>
              <LegalStrong>Secure session handling:</LegalStrong> session
              cookies are managed with standard security attributes.
            </>,
          ]}
        />
        <LegalParagraph>
          While we work hard to protect your information, no method of
          transmission over the Internet or method of electronic storage is
          100% secure, and we cannot guarantee absolute security.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="cookies" title="8. Cookies">
        <LegalList
          items={[
            <>
              <LegalStrong>Session cookies:</LegalStrong> required to keep you
              signed in and to operate the platform.
            </>,
            <>
              <LegalStrong>Authentication cookies:</LegalStrong> used to verify
              that you are the authorized account holder.
            </>,
            <>
              We do <LegalStrong>not</LegalStrong> use advertising cookies, and
              we do not sell your personal information to advertisers.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="third-party-services" title="9. Third-Party Services">
        <LegalParagraph>
          InternIQ relies on trusted third-party service providers to operate
          the platform:
        </LegalParagraph>
        <LegalList
          items={[
            <><LegalStrong>Google:</LegalStrong> OAuth sign-in and reCAPTCHA.</>,
            <><LegalStrong>Supabase:</LegalStrong> database, authentication, and storage.</>,
            <><LegalStrong>SMTP providers:</LegalStrong> delivery of transactional email (OTP, password reset, notifications).</>,
            <><LegalStrong>AI providers:</LegalStrong> generative AI services used to power analysis and recommendation features.</>,
          ]}
        />
        <LegalParagraph>
          These providers process data only to the extent necessary to deliver
          their respective services and are bound by their own privacy and
          security commitments.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="user-rights" title="10. Your Rights">
        <LegalList
          items={[
            <>
              <LegalStrong>Delete your account:</LegalStrong> you may request
              deletion of your account and associated data.
            </>,
            <>
              <LegalStrong>Request data deletion:</LegalStrong> you can ask us
              to remove your personal information from our systems.
            </>,
            <>
              <LegalStrong>Update your profile:</LegalStrong> you can edit or
              correct your profile information at any time.
            </>,
            <>
              <LegalStrong>Data retention:</LegalStrong> we retain your
              information only for as long as necessary to provide our
              services, comply with legal obligations, and resolve disputes.
            </>,
          ]}
        />
        <LegalParagraph>
          To exercise any of these rights, please use the{" "}
          <a
            href="/contact"
            className="font-semibold text-teal-dark dark:text-teal-300 underline decoration-teal/40 underline-offset-2 hover:decoration-teal"
          >
            contact form
          </a>{" "}
          on our website.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="children" title="11. Children&apos;s Privacy">
        <LegalParagraph>
          InternIQ is intended for university students, graduates, and
          recruiters. The platform is not directed to children under the age of
          13, and we do not knowingly collect personal information from
          children under 13. If you believe a child has provided us with
          personal information, please contact us so we can take appropriate
          action.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="changes" title="12. Changes to This Policy">
        <LegalParagraph>
          We may update this Privacy Policy from time to time. When we make
          material changes, we will update the “Last updated” date at the top
          of this page and, where appropriate, notify you through the platform
          or by email. Your continued use of InternIQ after changes take effect
          constitutes acceptance of the revised policy.
        </LegalParagraph>
      </LegalSection>

      <LegalSection id="contact" title="13. Contact Us">
        <LegalParagraph>
          If you have any questions about this Privacy Policy or how your data
          is handled, please use the{" "}
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
