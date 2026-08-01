import { jsPDF } from "jspdf";
import type { CandidateAiAnalysis } from "@/lib/types";

export interface AiReportMeta {
  applicantName: string;
  internshipTitle?: string;
}

/**
 * Builds a branded, recruiter-facing PDF of the AI candidate analysis.
 * Runs fully client-side (jsPDF) so the recruiter always gets a real PDF,
 * not a JSON blob.
 */
export function downloadAiReportPdf(analysis: CandidateAiAnalysis, meta: AiReportMeta): void {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const navy: [number, number, number] = [11, 31, 58];
  const teal: [number, number, number] = [23, 198, 181];
  const purple: [number, number, number] = [111, 82, 237];
  const gray: [number, number, number] = [109, 122, 146];
  const light: [number, number, number] = [247, 249, 252];

  function ensureSpace(needed: number) {
    if (y + needed > 282) {
      doc.addPage();
      y = margin;
    }
  }

  function sectionTitle(title: string) {
    ensureSpace(16);
    doc.setFillColor(navy[0], navy[1], navy[2]);
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(title.toUpperCase(), margin + 4, y + 5.5);
    y += 13;
  }

  function paragraph(text: string, size = 9, color: [number, number, number] = gray, maxW = contentWidth) {
    ensureSpace(10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxW);
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.35 + 1.5);
  }

  function bulletList(items: string[], color: [number, number, number] = gray) {
    if (!items.length) {
      paragraph("None listed.", 8.5);
      return;
    }
    doc.setFontSize(8.5);
    doc.setTextColor(color[0], color[1], color[2]);
    items.forEach((item) => {
      ensureSpace(8);
      const lines = doc.splitTextToSize(`•  ${item}`, contentWidth - 5);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4.5;
    });
    y += 2;
  }

  // ---------- Header band ----------
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, pageWidth, 24, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("InternIQ", margin, 10);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("AI Candidate Analysis Report", pageWidth - margin, 10, { align: "right" });
  doc.setFontSize(7);
  doc.setTextColor(190, 210, 230);
  doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth - margin, 16, { align: "right" });

  y = 34;

  // ---------- Candidate header ----------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(meta.applicantName || "Candidate", margin, y);
  y += 7;
  if (meta.internshipTitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text(`Applied for: ${meta.internshipTitle}`, margin, y);
    y += 6;
  }

  // ---------- Score + recommendation ----------
  y += 2;
  doc.setFillColor(light[0], light[1], light[2]);
  doc.roundedRect(margin, y, contentWidth, 26, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  const score = Math.max(0, Math.min(100, Math.round(analysis.match_score ?? 0)));
  const scoreColor: [number, number, number] =
    score >= 80 ? [41, 211, 145] : score >= 60 ? teal : score >= 40 ? [245, 158, 11] : [239, 68, 68];
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${score}%`, margin + 8, y + 18);
  doc.setFontSize(8);
  doc.setTextColor(gray[0], gray[1], gray[2]);
  doc.text("AI MATCH SCORE", margin + 34, y + 10);
  doc.text("Resume vs. Internship Requirements", margin + 34, y + 15);

  doc.setFillColor(purple[0], purple[1], purple[2]);
  doc.roundedRect(margin + 8, y + 2, 26, 6, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text((analysis.recommendation || "Review").toUpperCase(), margin + 10, y + 6.2);
  y += 32;

  // ---------- Reasoning ----------
  if (analysis.reasoning) {
    sectionTitle("AI Reasoning");
    paragraph(analysis.reasoning, 9, navy);
  }

  // ---------- Sub-scores ----------
  const subScores: [string, number | undefined][] = [
    ["Technical Skills", analysis.technical_score],
    ["Education Fit", analysis.education_score],
    ["Experience Level", analysis.experience_score],
    ["Communication", analysis.communication_score],
    ["Culture Fit", analysis.culture_fit_score],
    ["Resume Quality", analysis.resume_quality_score],
  ];
  const present = subScores.filter(([, v]) => typeof v === "number" && v !== null) as [string, number][];
  if (present.length > 0) {
    sectionTitle("Score Breakdown");
    present.forEach(([label, value]) => {
      ensureSpace(9);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(navy[0], navy[1], navy[2]);
      doc.text(label, margin, y);
      doc.text(`${Math.round(value)}%`, margin + contentWidth - 14, y, { align: "right" });
      y += 1.5;
      doc.setFillColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, 2.5, "F");
      doc.setFillColor(teal[0], teal[1], teal[2]);
      doc.rect(margin, y, (contentWidth * Math.max(0, Math.min(100, value))) / 100, 2.5, "F");
      y += 6;
    });
  }

  // ---------- Strengths ----------
  sectionTitle("Strengths");
  bulletList(analysis.strengths || [], [41, 211, 145]);

  // ---------- Weaknesses ----------
  sectionTitle("Areas for Improvement");
  bulletList(analysis.weaknesses || [], [239, 68, 68]);

  // ---------- Missing skills ----------
  sectionTitle("Missing / Suggested Skills");
  bulletList(analysis.missing_skills || [], purple);

  // ---------- Summary blocks ----------
  if (analysis.candidate_summary) {
    sectionTitle("Candidate Summary");
    paragraph(analysis.candidate_summary, 9, navy);
  }
  if (analysis.strength_summary) {
    sectionTitle("Strength Summary");
    paragraph(analysis.strength_summary, 9, navy);
  }
  if (analysis.risk_summary) {
    sectionTitle("Risk Summary");
    paragraph(analysis.risk_summary, 9, navy);
  }

  // ---------- Per-dimension explanations ----------
  const explanations: [string, string | undefined][] = [
    ["Overall Assessment", analysis.overall_explanation],
    ["Technical Score", analysis.technical_reason],
    ["Education Score", analysis.education_reason],
    ["Experience Score", analysis.experience_reason],
    ["Communication Score", analysis.communication_reason],
    ["Culture Fit Score", analysis.culture_reason],
  ];
  explanations.forEach(([title, text]) => {
    if (!text) return;
    sectionTitle(title);
    paragraph(text, 9, navy);
  });

  // ---------- Recruiter notes ----------
  if (analysis.recruiter_notes) {
    sectionTitle("Recruiter Notes");
    paragraph(analysis.recruiter_notes, 9, gray);
  }

  // ---------- Footer ----------
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("InternIQ · AI Candidate Analysis Report · Confidential", margin, 292);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, 292, { align: "right" });
  }

  const safeName = (meta.applicantName || "Candidate").replace(/[^a-z0-9]+/gi, "_");
  doc.save(`AI_Analysis_${safeName}.pdf`);
}
