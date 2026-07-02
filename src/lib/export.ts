import type { Candidate, AnalyticsSummary } from "../types";
import { DECISION_LABELS } from "../types";

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadBlob(content: string, mimeType: string, fileName: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Builds a CSV of the given candidates and triggers a browser download. Pure client-side formatting. */
export function exportCandidatesToCsv(candidates: Candidate[], fileName = "candidates.csv") {
  const headers = [
    "Name",
    "Title",
    "AI Match",
    "Skills Match",
    "Experience Match",
    "Education",
    "Resume Quality",
    "AI Confidence",
    "Status",
  ];

  const rows = candidates.map((c) => [
    c.name,
    c.title,
    c.overallScore,
    c.skillMatch,
    c.experienceMatch,
    c.educationLevel,
    c.resumeQuality,
    c.aiConfidence,
    DECISION_LABELS[c.decision],
  ]);

  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  downloadBlob(csv, "text/csv;charset=utf-8;", fileName);
}

/** Flattens the executive analytics summary into a CSV of key metrics. Pure client-side formatting. */
export function exportAnalyticsToCsv(summary: AnalyticsSummary, fileName = "analytics-summary.csv") {
  const rows: [string, string | number][] = [
    ["Total Jobs", summary.totalJobs],
    ["Total Candidates", summary.totalCandidates],
    ["Average AI Match", `${summary.avgAiMatch}%`],
    ["Hiring Efficiency", `${summary.hiringEfficiency}%`],
    ["Interview Rate", `${summary.interviewRate}%`],
    ["Offer Rate", `${summary.offerRate}%`],
    ["Average Time To Decision (days)", summary.avgTimeToDecisionDays],
  ];
  const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
  downloadBlob(csv, "text/csv;charset=utf-8;", fileName);
}

/** Produces a short plain-text executive summary report. Pure client-side formatting. */
export function exportAnalyticsReport(summary: AnalyticsSummary, fileName = "hiring-report.txt") {
  const lines = [
    "RedRank AI — Executive Hiring Report",
    "=====================================",
    "",
    `Total Jobs: ${summary.totalJobs}`,
    `Total Candidates: ${summary.totalCandidates}`,
    `Average AI Match: ${summary.avgAiMatch}%`,
    `Hiring Efficiency: ${summary.hiringEfficiency}%`,
    `Interview Rate: ${summary.interviewRate}%`,
    `Offer Rate: ${summary.offerRate}%`,
    `Average Time To Decision: ${summary.avgTimeToDecisionDays} days`,
    "",
    "AI Insights",
    "-----------",
    ...summary.insights.map((i) => `• ${i}`),
  ];
  downloadBlob(lines.join("\n"), "text/plain;charset=utf-8;", fileName);
}
