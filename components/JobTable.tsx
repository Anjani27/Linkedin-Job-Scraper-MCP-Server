"use client";

import { useState, useMemo, Fragment } from "react";
import { JobListing } from "@/lib/types";

interface JobTableProps {
  jobs: JobListing[];
}

type SortKey =
  | "title"
  | "company"
  | "location"
  | "postedTime"
  | "employmentType";
type SortDir = "asc" | "desc";

export default function JobTable({ jobs }: JobTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const perPage = 10;

  // Extract unique cities from all jobs
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    jobs.forEach((j) => {
      if (j.city && j.city !== "Unknown") cities.add(j.city);
    });
    return Array.from(cities).sort();
  }, [jobs]);

  // Extract unique employment types
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    jobs.forEach((j) => {
      if (j.employmentType && j.employmentType !== "Not specified")
        types.add(j.employmentType);
    });
    return Array.from(types).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    let result = jobs;

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          (j.description && j.description.toLowerCase().includes(q))
      );
    }

    // City filter
    if (cityFilter) {
      result = result.filter((j) => j.city === cityFilter);
    }

    // Type filter
    if (typeFilter) {
      result = result.filter((j) => j.employmentType === typeFilter);
    }

    return result;
  }, [jobs, search, cityFilter, typeFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = (a[sortKey] || "").toLowerCase();
      const bVal = (b[sortKey] || "").toLowerCase();
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  };

  const clearFilters = () => {
    setSearch("");
    setCityFilter("");
    setTypeFilter("");
    setPage(1);
  };

  const hasActiveFilters = search || cityFilter || typeFilter;

  if (jobs.length === 0) {
    return (
      <div className="empty-state">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          <line x1="12" y1="12" x2="12" y2="16" />
          <line x1="10" y1="14" x2="14" y2="14" />
        </svg>
        <div
          style={{ fontSize: "15px", fontWeight: 500, marginBottom: "6px" }}
        >
          No jobs scraped yet
        </div>
        <div style={{ fontSize: "13px" }}>
          Start a scrape to see results here
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters Bar */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "16px",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        {/* Search */}
        <div style={{ flex: "1 1 250px", minWidth: "200px" }}>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--text-muted)",
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Search Results
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="🔍 Search by title, company, location, or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* City Filter */}
        <div style={{ flex: "0 1 180px", minWidth: "150px" }}>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--text-muted)",
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            📍 Filter by City
          </label>
          <select
            className="select-field"
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Cities ({availableCities.length})</option>
            {availableCities.map((city) => {
              const count = jobs.filter((j) => j.city === city).length;
              return (
                <option key={city} value={city}>
                  {city} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Type Filter */}
        <div style={{ flex: "0 1 160px", minWidth: "130px" }}>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--text-muted)",
              marginBottom: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            💼 Filter by Type
          </label>
          <select
            className="select-field"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Types</option>
            {availableTypes.map((type) => {
              const count = jobs.filter(
                (j) => j.employmentType === type
              ).length;
              return (
                <option key={type} value={type}>
                  {type} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            className="btn-secondary"
            onClick={clearFilters}
            style={{
              height: "42px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--accent-red)",
              borderColor: "rgba(239, 68, 68, 0.2)",
              flexShrink: 0,
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Filter summary */}
      {hasActiveFilters && (
        <div
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            marginBottom: "12px",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span>Showing {sorted.length} of {jobs.length} results</span>
          {cityFilter && (
            <span className="badge badge-running">📍 {cityFilter}</span>
          )}
          {typeFilter && (
            <span className="badge badge-success">💼 {typeFilter}</span>
          )}
          {search && (
            <span className="badge badge-queued">🔍 &quot;{search}&quot;</span>
          )}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: "12px",
          border: "1px solid var(--glass-border)",
        }}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th
                onClick={() => handleSort("title")}
                style={{ minWidth: "200px" }}
              >
                Title {getSortIcon("title")}
              </th>
              <th
                onClick={() => handleSort("company")}
                style={{ minWidth: "150px" }}
              >
                Company {getSortIcon("company")}
              </th>
              <th
                onClick={() => handleSort("location")}
                style={{ minWidth: "130px" }}
              >
                Location {getSortIcon("location")}
              </th>
              <th onClick={() => handleSort("employmentType")}>
                Type {getSortIcon("employmentType")}
              </th>
              <th onClick={() => handleSort("postedTime")}>
                Posted {getSortIcon("postedTime")}
              </th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((job) => (
              <Fragment key={job.id}>
                <tr
                  onClick={() =>
                    setExpandedId(expandedId === job.id ? null : job.id)
                  }
                  style={{ cursor: "pointer" }}
                >
                  <td
                    style={{ color: "var(--text-primary)", fontWeight: 500 }}
                  >
                    {job.title}
                  </td>
                  <td>{job.company}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>{job.city || "—"}</span>
                      {job.location !== job.city && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {job.location}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-running">
                      {job.employmentType}
                    </span>
                  </td>
                  <td>{job.postedTime}</td>
                  <td>
                    <a
                      href={job.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open ↗
                    </a>
                  </td>
                </tr>
                {expandedId === job.id && (
                  <tr key={`${job.id}-detail`}>
                    <td
                      colSpan={6}
                      style={{ whiteSpace: "normal", maxWidth: "none" }}
                    >
                      <div
                        className="fade-in"
                        style={{
                          padding: "16px",
                          background: "rgba(255,255,255,0.02)",
                          borderRadius: "8px",
                        }}
                      >
                        {/* Meta info row */}
                        <div
                          style={{
                            display: "flex",
                            gap: "20px",
                            flexWrap: "wrap",
                            marginBottom: "12px",
                          }}
                        >
                          {job.salary && (
                            <div>
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "var(--text-muted)",
                                  textTransform: "uppercase",
                                }}
                              >
                                💰 Salary
                              </span>
                              <div
                                style={{
                                  color: "var(--accent-green)",
                                  fontWeight: 500,
                                  fontSize: "13px",
                                }}
                              >
                                {job.salary}
                              </div>
                            </div>
                          )}
                          {job.seniorityLevel && (
                            <div>
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "var(--text-muted)",
                                  textTransform: "uppercase",
                                }}
                              >
                                📊 Seniority
                              </span>
                              <div
                                style={{
                                  color: "var(--accent-purple)",
                                  fontWeight: 500,
                                  fontSize: "13px",
                                }}
                              >
                                {job.seniorityLevel}
                              </div>
                            </div>
                          )}
                          {job.applicants && (
                            <div>
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "var(--text-muted)",
                                  textTransform: "uppercase",
                                }}
                              >
                                👥 Applicants
                              </span>
                              <div
                                style={{
                                  color: "var(--accent-orange)",
                                  fontWeight: 500,
                                  fontSize: "13px",
                                }}
                              >
                                {job.applicants}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Skills */}
                        {job.skills && job.skills.length > 0 && (
                          <div style={{ marginBottom: "12px" }}>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                display: "block",
                                marginBottom: "6px",
                              }}
                            >
                              🏷️ Skills
                            </span>
                            <div
                              style={{
                                display: "flex",
                                gap: "6px",
                                flexWrap: "wrap",
                              }}
                            >
                              {job.skills.map((skill, i) => (
                                <span
                                  key={i}
                                  style={{
                                    padding: "3px 10px",
                                    borderRadius: "12px",
                                    fontSize: "11px",
                                    background: "rgba(139, 92, 246, 0.1)",
                                    color: "var(--accent-purple)",
                                    border:
                                      "1px solid rgba(139, 92, 246, 0.2)",
                                  }}
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {job.description ? (
                          <div>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                display: "block",
                                marginBottom: "6px",
                              }}
                            >
                              📝 Description
                            </span>
                            <div
                              style={{
                                lineHeight: 1.7,
                                color: "var(--text-secondary)",
                                whiteSpace: "pre-wrap",
                                maxHeight: "400px",
                                overflowY: "auto",
                                fontSize: "13px",
                                padding: "12px",
                                background: "rgba(255,255,255,0.02)",
                                borderRadius: "8px",
                                border: "1px solid var(--glass-border)",
                              }}
                            >
                              {job.description}
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              color: "var(--text-muted)",
                              fontStyle: "italic",
                              fontSize: "13px",
                            }}
                          >
                            No description available for this listing
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* No results after filtering */}
      {sorted.length === 0 && hasActiveFilters && (
        <div
          className="empty-state"
          style={{ padding: "40px 20px" }}
        >
          <div style={{ fontSize: "14px", marginBottom: "8px" }}>
            No jobs match your filters
          </div>
          <button className="btn-secondary" onClick={clearFilters}>
            Clear all filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "16px",
            fontSize: "13px",
            color: "var(--text-muted)",
          }}
        >
          <span>
            Showing {(page - 1) * perPage + 1}–
            {Math.min(page * perPage, sorted.length)} of {sorted.length}
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn-secondary"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{ opacity: page === 1 ? 0.4 : 1 }}
            >
              ← Prev
            </button>
            <button
              className="btn-secondary"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              style={{ opacity: page === totalPages ? 0.4 : 1 }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
