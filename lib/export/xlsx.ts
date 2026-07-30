"use client";

import * as XLSX from "xlsx";

export interface ExcelRow {
  [key: string]: string | number;
}

export function generateAndDownloadXlsx(
  data: ExcelRow[],
  filename: string = "candidates_export.xlsx"
) {
  if (data.length === 0) return;

  const ws = XLSX.utils.json_to_sheet(data);

  const colWidths: XLSX.ColInfo[] = [];
  const headers = Object.keys(data[0]);
  headers.forEach((header) => {
    const maxLen = Math.max(
      header.length,
      ...data.map((row) => String(row[header] || "").length)
    );
    colWidths.push({ wch: Math.min(Math.max(maxLen + 2, 15), 50) });
  });
  ws["!cols"] = colWidths;

  const headerCellStyle: any = {
    fill: { fgColor: { rgb: "0B1F3A" } },
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 }
  };

  const range = XLSX.utils.decode_range(ws["!ref"] || "A1:Z1");
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (ws[cellAddress]) {
      ws[cellAddress].s = headerCellStyle;
    }
  }

  ws["!freeze"] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Candidates");
  XLSX.writeFile(wb, filename);
}
