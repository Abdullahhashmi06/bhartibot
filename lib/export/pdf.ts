import { jsPDF } from "jspdf";
import { Application, CandidateAiAnalysis } from "@/lib/types";
import { RecruiterNote } from "@/lib/queries/recruiter-notes";
import { Interview } from "@/lib/queries/interview";

export interface ExportData {
  application: Application;
  analysis?: CandidateAiAnalysis | null;
  notes?: RecruiterNote[];
  interview?: Interview | null;
  internshipTitle?: string;
}

export function generateCandidatePdf(data: ExportData): jsPDF {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const primary = "#0B1F3A";
  const teal = "#17C6B5";
  const purple = "#6F52ED";
  const gray = "#6D7A92";
  const lightGray = "#F7F9FC";

  // Helper functions
  function addSection(title: string, startY: number): number {
    doc.setFillColor(parseInt(primary.slice(1, 3), 16), parseInt(primary.slice(3, 5), 16), parseInt(primary.slice(5, 7), 16));
    doc.rect(margin, startY, contentWidth, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title.toUpperCase(), margin + 4, startY + 6);
    doc.setTextColor(0, 0, 0);
    return startY + 14;
  }

  function addText(text: string, startY: number, opts?: { size?: number; color?: string; bold?: boolean; maxWidth?: number }): number {
    const size = opts?.size || 9;
    const color = opts?.color || primary;
    const maxW = opts?.maxWidth || contentWidth;
    doc.setFontSize(size);
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setTextColor(
      parseInt(color.slice(1, 3), 16),
      parseInt(color.slice(3, 5), 16),
      parseInt(color.slice(5, 7), 16)
    );
    const lines = doc.splitTextToSize(text, maxW);
    doc.text(lines, margin, startY);
    return startY + lines.length * (size * 0.35 + 1);
  }

  function addDivider(startY: number): number {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, startY, pageWidth - margin, startY);
    return startY + 4;
  }

  // --- Header ---
  // Brand bar
  doc.setFillColor(parseInt(primary.slice(1, 3), 16), parseInt(primary.slice(3, 5), 16), parseInt(primary.slice(5, 7), 16));
  doc.rect(0, 0, pageWidth, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("InternIQ", margin, 14);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("AI-Powered Recruitment Report", pageWidth - margin, 14, { align: "right" });

  y = 30;

  // Candidate Name + Title
  doc.setTextColor(
    parseInt(primary.slice(1, 3), 16),
    parseInt(primary.slice(3, 5), 16),
    parseInt(primary.slice(5, 7), 16)
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(data.application.applicant_name, margin, y);
  y += 8;

  if (data.internshipTitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(
      parseInt(gray.slice(1, 3), 16),
      parseInt(gray.slice(3, 5), 16),
      parseInt(gray.slice(5, 7), 16)
    );
    doc.text(`Applied for: ${data.internshipTitle}`, margin, y);
    y += 6;
  }

  doc.setFontSize(8);
  doc.setTextColor(
    parseInt(gray.slice(1, 3), 16),
    parseInt(gray.slice(3, 5), 16),
    parseInt(gray.slice(5, 7), 16)
  );
  doc.text(`Report generated: ${new Date().toLocaleDateString()}`, margin, y);
  y += 10;

  // --- AI Score Section ---
  if (data.analysis) {
    y = addSection("AI Match Analysis", y);

    // Score gauge
    const score = data.analysis.match_score;
    const scoreColor = score >= 80 ? "#29D391" : score >= 60 ? "#17C6B5" : score >= 40 ? "#F59E0B" : "#EF4444";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(
      parseInt(scoreColor.slice(1, 3), 16),
      parseInt(scoreColor.slice(3, 5), 16),
      parseInt(scoreColor.slice(5, 7), 16)
    );
    doc.text(`${score}%`, margin, y);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(
      parseInt(gray.slice(1, 3), 16),
      parseInt(gray.slice(3, 5), 16),
      parseInt(gray.slice(5, 7), 16)
    );
    doc.text("Match Score", margin + 22, y - 2);
    y += 8;

    // Recommendation tag
    doc.setFillColor(
      parseInt(purple.slice(1, 3), 16),
      parseInt(purple.slice(3, 5), 16),
      parseInt(purple.slice(5, 7), 16)
    );
    doc.rect(margin, y, 40, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(data.analysis.recommendation.toUpperCase(), margin + 3, y + 4.5);
    doc.setTextColor(0, 0, 0);
    y += 12;

    // Strengths
    if (data.analysis.strengths.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(
        parseInt(teal.slice(1, 3), 16),
        parseInt(teal.slice(3, 5), 16),
        parseInt(teal.slice(5, 7), 16)
      );
      doc.text("Strengths:", margin, y);
      y += 5;
      data.analysis.strengths.forEach((s) => {
        y = addText(`• ${s}`, y, { size: 8, color: primary });
      });
      y += 3;
    }

    // Weaknesses
    if (data.analysis.weaknesses.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(239, 68, 68);
      doc.text("Weaknesses:", margin, y);
      y += 5;
      data.analysis.weaknesses.forEach((w) => {
        y = addText(`• ${w}`, y, { size: 8, color: primary });
      });
      y += 3;
    }

    // Missing Skills
    if (data.analysis.missing_skills.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(
        parseInt(purple.slice(1, 3), 16),
        parseInt(purple.slice(3, 5), 16),
        parseInt(purple.slice(5, 7), 16)
      );
      doc.text("Missing Skills:", margin, y);
      y += 5;
      data.analysis.missing_skills.forEach((s) => {
        y = addText(`• ${s}`, y, { size: 8, color: primary });
      });
      y += 3;
    }

    // Reasoning
    if (data.analysis.reasoning) {
      y = addDivider(y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(
        parseInt(primary.slice(1, 3), 16),
        parseInt(primary.slice(3, 5), 16),
        parseInt(primary.slice(5, 7), 16)
      );
      doc.text("AI Reasoning:", margin, y);
      y += 5;
      y = addText(data.analysis.reasoning, y, { size: 8, color: gray });
    }

    y += 6;
  }

  // --- Contact & Education ---
  y = addSection("Candidate Information", y);
  const app = data.application;

  const infoLines = [
    ["Name", app.applicant_name],
    ["Email", app.email],
    ["Phone", app.phone || "N/A"],
    ["University", app.university || "N/A"],
    ["Degree", app.degree || "N/A"],
    ["CGPA", app.cgpa || "N/A"],
    ["Applied", new Date(app.created_at).toLocaleDateString()],
  ];

  infoLines.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(
      parseInt(gray.slice(1, 3), 16),
      parseInt(gray.slice(3, 5), 16),
      parseInt(gray.slice(5, 7), 16)
    );
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(
      parseInt(primary.slice(1, 3), 16),
      parseInt(primary.slice(3, 5), 16),
      parseInt(primary.slice(5, 7), 16)
    );
    doc.text(value, margin + 35, y);
    y += 5;
  });

  y += 4;

  // --- Interview Status ---
  if (data.interview) {
    y = addSection("Interview Status", y);
    const iv = data.interview;
    const statusMap: Record<string, string> = {
      not_scheduled: "Not Scheduled",
      scheduled: "Scheduled",
      completed: "Completed",
      cancelled: "Cancelled",
      offer_sent: "Offer Sent",
      rejected: "Rejected",
    };

    const interviewLines = [
      ["Status", statusMap[iv.status] || iv.status],
      ["Date", iv.interview_date],
      ["Time", iv.interview_time],
      ["Type", iv.interview_type.replace("_", " ")],
      ["Interviewer", iv.interviewer_name],
      ["Meeting", iv.meeting_link || "N/A"],
    ];

    interviewLines.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(
        parseInt(gray.slice(1, 3), 16),
        parseInt(gray.slice(3, 5), 16),
        parseInt(gray.slice(5, 7), 16)
      );
      doc.text(label, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(
        parseInt(primary.slice(1, 3), 16),
        parseInt(primary.slice(3, 5), 16),
        parseInt(primary.slice(5, 7), 16)
      );
      doc.text(value, margin + 35, y);
      y += 5;
    });

    if (iv.technical_rating !== null) {
      y += 3;
      y = addDivider(y);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(
        parseInt(primary.slice(1, 3), 16),
        parseInt(primary.slice(3, 5), 16),
        parseInt(primary.slice(5, 7), 16)
      );
      doc.text("Interview Feedback", margin, y);
      y += 6;

      const ratings = [
        ["Technical Rating", `${iv.technical_rating}/5`],
        ["Communication", `${iv.communication_rating}/5`],
        ["Culture Fit", `${iv.culture_fit}/5`],
      ];

      ratings.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(
          parseInt(gray.slice(1, 3), 16),
          parseInt(gray.slice(3, 5), 16),
          parseInt(gray.slice(5, 7), 16)
        );
        doc.text(label, margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(
          parseInt(teal.slice(1, 3), 16),
          parseInt(teal.slice(3, 5), 16),
          parseInt(teal.slice(5, 7), 16)
        );
        doc.text(value, margin + 40, y);
        y += 5;
      });

      if (iv.overall_recommendation) {
        y = addText(`Recommendation: ${iv.overall_recommendation}`, y, { size: 8, bold: true, color: purple });
      }
      if (iv.overall_decision) {
        y = addText(`Decision: ${iv.overall_decision.toUpperCase()}`, y, { size: 8, bold: true, color: primary });
      }
      if (iv.feedback_notes) {
        y = addText(`Notes: ${iv.feedback_notes}`, y, { size: 8, color: gray });
      }
    }
  }

  // --- Recruiter Notes ---
  if (data.notes && data.notes.length > 0) {
    // Check if we need a new page
    if (y > 240) {
      doc.addPage();
      y = margin;
    }
    y = addSection("Recruiter Notes", y);
    data.notes.slice(0, 5).forEach((note) => {
      if (y > 270) {
        doc.addPage();
        y = margin;
      }
      y = addText(`• ${note.content}`, y, { size: 8, color: primary, maxWidth: contentWidth - 10 });
      doc.setFontSize(7);
      doc.setTextColor(
        parseInt(gray.slice(1, 3), 16),
        parseInt(gray.slice(3, 5), 16),
        parseInt(gray.slice(5, 7), 16)
      );
      doc.text(new Date(note.created_at).toLocaleString(), margin + 5, y);
      y += 5;
    });
  }

  // --- Footer ---
  doc.setFontSize(7);
  doc.setTextColor(
    parseInt(gray.slice(1, 3), 16),
    parseInt(gray.slice(3, 5), 16),
    parseInt(gray.slice(5, 7), 16)
  );
  doc.text(`InternIQ · Confidential Recruitment Report · Page 1`, margin, 285);

  return doc;
}

export function downloadCandidatePdf(data: ExportData) {
  const doc = generateCandidatePdf(data);
  const filename = `${data.application.applicant_name.replace(/\s+/g, "_")}_InternIQ_Report.pdf`;
  doc.save(filename);
}
