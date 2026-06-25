"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ScrapeJob, ScrapeRequest, JobListing } from "@/lib/types";
import SearchForm from "@/components/SearchForm";
import StatsBar from "@/components/StatsBar";
import StatusCard from "@/components/StatusCard";
import JobTable from "@/components/JobTable";
import ExportButtons from "@/components/ExportButtons";

interface Stats {
  totalScrapeJobs: number;
  totalJobsFound: number;
  successRate: number;
  avgScrapeTime: number;
}

export default function Dashboard() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalScrapeJobs: 0,
    totalJobsFound: 0,
    successRate: 0,
    avgScrapeTime: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedResults, setSelectedResults] = useState<JobListing[]>([]);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/scrape");
      const data = await res.json();
      setJobs(data.jobs || []);
      setStats(data.stats || stats);
    } catch {
      // silently fail
    }
  }, []);

  // Poll for updates when there are running jobs
  useEffect(() => {
    fetchJobs();

    pollRef.current = setInterval(() => {
      fetchJobs();
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchJobs]);

  // Stop polling when no running jobs
  useEffect(() => {
    const hasRunning = jobs.some(
      (j) => j.status === "running" || j.status === "queued"
    );
    if (!hasRunning && !isLoading && pollRef.current) {
      // Keep polling but slower
      clearInterval(pollRef.current);
      pollRef.current = setInterval(fetchJobs, 10000);
    }
  }, [jobs, isLoading, fetchJobs]);

  const handleSubmit = async (request: ScrapeRequest) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = await res.json();

      if (res.ok) {
        // Speed up polling while scraping
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(fetchJobs, 2000);
        fetchJobs();
      } else {
        alert(data.error || "Failed to start scrape");
      }
    } catch {
      alert("Failed to connect to the server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewResults = async (jobId: string) => {
    try {
      const res = await fetch(`/api/scrape/${jobId}`);
      const data = await res.json();
      setSelectedJobId(jobId);
      setSelectedResults(data.results || []);
    } catch {
      alert("Failed to load results");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    
    // Optimistic UI update
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    if (selectedJobId === jobId) {
      handleBackToJobs();
    }
    
    try {
      await fetch(`/api/scrape/${jobId}`, { method: "DELETE" });
      fetchJobs(); // Refresh stats
    } catch {
      alert("Failed to delete job");
      fetchJobs(); // Revert on failure
    }
  };

  const handleBackToJobs = () => {
    setSelectedJobId(null);
    setSelectedResults([]);
  };

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "30px 24px",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "var(--accent-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              boxShadow: "0 4px 20px rgba(99, 102, 241, 0.3)",
            }}
          >
            🔗
          </div>
          <div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                background: "var(--accent-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              LinkedIn Job Scraper
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              Search, scrape & export job listings
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "var(--text-muted)",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--accent-green)",
              boxShadow: "0 0 8px var(--accent-green)",
            }}
          />
          System Online
        </div>
      </header>

      {/* Stats */}
      <div style={{ marginBottom: "24px" }}>
        <StatsBar {...stats} />
      </div>

      {/* Search Form */}
      <div style={{ marginBottom: "24px" }}>
        <SearchForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>

      {/* Active / Recent Jobs */}
      {jobs.length > 0 && !selectedJobId && (
        <div style={{ marginBottom: "24px" }}>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: 600,
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--accent-cyan)" }}
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Scrape Jobs
            <span
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                fontWeight: 400,
              }}
            >
              ({jobs.length})
            </span>
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {jobs.map((job) => (
              <StatusCard
                key={job.id}
                job={job}
                onViewResults={handleViewResults}
                onDelete={handleDeleteJob}
              />
            ))}
          </div>
        </div>
      )}

      {/* Results View */}
      {selectedJobId && (
        <div className="fade-in">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                className="btn-secondary"
                onClick={handleBackToJobs}
              >
                ← Back
              </button>
              <h2 style={{ fontSize: "15px", fontWeight: 600 }}>
                Results
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    fontWeight: 400,
                    marginLeft: "8px",
                  }}
                >
                  ({selectedResults.length} jobs)
                </span>
              </h2>
            </div>
            <ExportButtons
              jobId={selectedJobId}
              resultCount={selectedResults.length}
            />
          </div>
          <div className="glass-card" style={{ padding: "20px" }}>
            <JobTable jobs={selectedResults} />
          </div>
        </div>
      )}

      {/* Empty State */}
      {jobs.length === 0 && !selectedJobId && (
        <div className="glass-card empty-state" style={{ marginTop: "16px" }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: "56px", height: "56px", opacity: 0.3 }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 600,
              marginTop: "16px",
              marginBottom: "8px",
            }}
          >
            Ready to scrape
          </div>
          <div
            style={{
              fontSize: "13px",
              maxWidth: "400px",
              lineHeight: 1.6,
            }}
          >
            Enter keywords and filters above to start scraping LinkedIn job
            listings. Results will appear here in real-time.
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "32px 0 16px",
          fontSize: "12px",
          color: "var(--text-muted)",
        }}
      >
        Built with Next.js + Playwright • For educational purposes only
      </footer>
    </div>
  );
}
