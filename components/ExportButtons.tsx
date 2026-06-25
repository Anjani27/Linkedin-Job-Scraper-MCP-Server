"use client";

interface ExportButtonsProps {
  jobId: string;
  resultCount: number;
}

export default function ExportButtons({ jobId, resultCount }: ExportButtonsProps) {
  const handleExport = (format: "json" | "csv") => {
    window.open(`/api/export/${jobId}?format=${format}`, "_blank");
  };

  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <button className="btn-secondary" onClick={() => handleExport("json")}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Export JSON
        </span>
      </button>
      <button className="btn-secondary" onClick={() => handleExport("csv")}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
          </svg>
          Export CSV
        </span>
      </button>
      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        {resultCount} records
      </span>
    </div>
  );
}
