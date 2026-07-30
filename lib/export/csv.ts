export interface CsvRow {
  Name: string;
  Email: string;
  University: string;
  Degree: string;
  CGPA: string;
  "AI Score": string;
  Recommendation: string;
  Status: string;
  "Interview Status": string;
  "Recruiter Notes": string;
}

export function generateCsv(rows: CsvRow[]): string {
  const headers = Object.keys(rows[0] || {}) as (keyof CsvRow)[];
  const csvRows = [headers.join(",")];

  rows.forEach((row) => {
    const values = headers.map((header) => {
      const val = row[header] ?? "";
      // Escape quotes and wrap in quotes if contains comma or newline
      const escaped = String(val).replace(/"/g, '""');
      if (escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')) {
        return `"${escaped}"`;
      }
      return escaped;
    });
    csvRows.push(values.join(","));
  });

  return csvRows.join("\n");
}

export function downloadCsv(data: CsvRow[], filename: string = "candidates_export.csv") {
  const csv = generateCsv(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
