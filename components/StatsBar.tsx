"use client";

interface StatsBarProps {
  totalScrapeJobs: number;
  totalJobsFound: number;
  successRate: number;
  avgScrapeTime: number;
}

export default function StatsBar({
  totalScrapeJobs,
  totalJobsFound,
  successRate,
  avgScrapeTime,
}: StatsBarProps) {
  const stats = [
    {
      label: "Total Runs",
      value: totalScrapeJobs,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ),
      color: "var(--accent-purple)",
    },
    {
      label: "Jobs Found",
      value: totalJobsFound,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        </svg>
      ),
      color: "var(--accent-cyan)",
    },
    {
      label: "Success Rate",
      value: `${successRate}%`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      color: "var(--accent-green)",
    },
    {
      label: "Avg Time",
      value: `${avgScrapeTime}s`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: "var(--accent-orange)",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "14px",
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="glass-card"
          style={{
            padding: "20px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: `${stat.color}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: stat.color,
              flexShrink: 0,
            }}
          >
            {stat.icon}
          </div>
          <div>
            <div
              className="count-up"
              style={{
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
