"use client";

import { useState, FormEvent } from "react";
import {
  JobTypeFilter,
  TimeFilter,
  ExperienceLevel,
  WorkType,
  JOB_TYPE_LABELS,
  TIME_FILTER_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  WORK_TYPE_LABELS,
  ScrapeRequest,
} from "@/lib/types";

interface SearchFormProps {
  onSubmit: (request: ScrapeRequest) => void;
  isLoading: boolean;
}

export default function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState<JobTypeFilter>("");
  const [timePosted, setTimePosted] = useState<TimeFilter>("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>("");
  const [workType, setWorkType] = useState<WorkType>("");
  const [maxResults, setMaxResults] = useState(25);
  const [strictTitle, setStrictTitle] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!keywords.trim()) return;
    onSubmit({
      keywords,
      location,
      jobType,
      timePosted,
      experienceLevel,
      workType,
      maxResults,
      strictTitle,
    });
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 500,
    color: "var(--text-muted)",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ padding: "28px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--accent-purple)" }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <h2 style={{ fontSize: "16px", fontWeight: 600 }}>Search Jobs</h2>
      </div>

      {/* Row 1: Keywords + Location */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px",
          marginBottom: "14px",
        }}
      >
        <div>
          <label style={labelStyle}>Keywords *</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. React Developer, Data Scientist"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Location</label>
          <input
            type="text"
            list="location-options"
            className="input-field"
            placeholder="e.g. United States, Worldwide, India"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <datalist id="location-options">
            <option value="India" />
            <option value="Worldwide" />
          </datalist>
        </div>
      </div>

      {/* Row 2: All Filters */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "14px",
          marginBottom: "16px",
        }}
      >
        <div>
          <label style={labelStyle}>Job Type</label>
          <select
            className="select-field"
            value={jobType}
            onChange={(e) => setJobType(e.target.value as JobTypeFilter)}
          >
            {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Time Posted</label>
          <select
            className="select-field"
            value={timePosted}
            onChange={(e) => setTimePosted(e.target.value as TimeFilter)}
          >
            {Object.entries(TIME_FILTER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Experience</label>
          <select
            className="select-field"
            value={experienceLevel}
            onChange={(e) =>
              setExperienceLevel(e.target.value as ExperienceLevel)
            }
          >
            {Object.entries(EXPERIENCE_LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Workplace</label>
          <select
            className="select-field"
            value={workType}
            onChange={(e) => setWorkType(e.target.value as WorkType)}
          >
            {Object.entries(WORK_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Max Results</label>
          <input
            type="number"
            className="input-field"
            min={5}
            max={100}
            value={maxResults}
            onChange={(e) => setMaxResults(parseInt(e.target.value) || 25)}
          />
        </div>
      </div>

      {/* Strict Match Toggle */}
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
        <input
          type="checkbox"
          id="strictTitle"
          checked={strictTitle}
          onChange={(e) => setStrictTitle(e.target.checked)}
          style={{ width: "16px", height: "16px", accentColor: "var(--accent-purple)", cursor: "pointer" }}
        />
        <label htmlFor="strictTitle" style={{ fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer", userSelect: "none", display: "flex", flexDirection: "column" }}>
          <span>AI Semantic Filter (Groq) <span style={{ color: "var(--accent-purple)", fontSize: "11px", fontWeight: "bold", marginLeft: "4px" }}>✨ Premium</span></span>
          <span style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "2px" }}>Uses AI to understand context and synonyms (e.g., matches "ML Engineer" when searching "AI Engineer").</span>
        </label>
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={isLoading || !keywords.trim()}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          marginTop: "4px",
        }}
      >
        {isLoading ? (
          <>
            <div className="spinner" />
            Scraping...
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Start Scraping
          </>
        )}
      </button>
    </form>
  );
}
