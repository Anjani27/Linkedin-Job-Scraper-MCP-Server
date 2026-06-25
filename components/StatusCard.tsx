"use client";

import {
  ScrapeJob,
  JOB_TYPE_LABELS,
  TIME_FILTER_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  WORK_TYPE_LABELS,
} from "@/lib/types";

interface StatusCardProps {
  job: ScrapeJob;
  onViewResults: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function StatusCard({ job, onViewResults, onDelete }: StatusCardProps) {
  const statusConfig = {
    queued: { label: "Queued", badgeClass: "badge-queued", dotColor: "var(--accent-orange)" },
    running: { label: "Running", badgeClass: "badge-running", dotColor: "var(--accent-blue)" },
    completed: { label: "Completed", badgeClass: "badge-success", dotColor: "var(--accent-green)" },
    failed: { label: "Failed", badgeClass: "badge-failed", dotColor: "var(--accent-red)" },
  };

  const config = statusConfig[job.status];
  const jobTypeLabel = JOB_TYPE_LABELS[job.request.jobType] || "All Types";
  const timeLabel = TIME_FILTER_LABELS[job.request.timePosted] || "Any time";
  const expLabel = EXPERIENCE_LEVEL_LABELS[job.request.experienceLevel] || "Any Level";
  const workLabel = WORK_TYPE_LABELS[job.request.workType] || "Any Workplace";

  const getDuration = () => {
    if (!job.completedAt) return "—";
    const ms = new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime();
    return `${Math.round(ms / 1000)}s`;
  };

  return (
    <div className="glass-card fade-in" style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "14px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span className={`badge ${config.badgeClass}`}>
              <div
                className={job.status === "running" ? "pulse-dot" : ""}
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: config.dotColor,
                }}
              />
              {config.label}
            </span>
            {job.status === "completed" && (
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {job.results.length} jobs found • {getDuration()}
              </span>
            )}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600 }}>
            {job.request.keywords}
            {job.request.location && (
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                {" "}
                in {job.request.location}
              </span>
            )}
          </div>
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "6px",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            <span>📋 {jobTypeLabel}</span>
            <span>🕐 {timeLabel}</span>
            {job.request.experienceLevel && <span>📊 {expLabel}</span>}
            {job.request.workType && <span>🏢 {workLabel}</span>}
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexShrink: 0, alignItems: "center" }}>
          {job.status === "completed" && job.results.length > 0 && (
            <button
              className="btn-secondary"
              onClick={() => onViewResults(job.id)}
            >
              View Results →
            </button>
          )}
          <button
            onClick={() => onDelete(job.id)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
              transition: "all 0.2s"
            }}
            title="Delete Job"
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
              e.currentTarget.style.color = "var(--accent-red)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>

      {(job.status === "running" || job.status === "queued") && (
        <div style={{ marginTop: "4px" }}>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${job.progress}%` }}
            />
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "6px",
              textAlign: "right",
            }}
          >
            {job.progress}%
          </div>
        </div>
      )}

      {job.status === "failed" && job.error && (
        <div
          style={{
            marginTop: "8px",
            padding: "10px 14px",
            background: "rgba(239, 68, 68, 0.08)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "var(--accent-red)",
            border: "1px solid rgba(239, 68, 68, 0.15)",
          }}
        >
          ⚠️ {job.error}
        </div>
      )}
    </div>
  );
}
