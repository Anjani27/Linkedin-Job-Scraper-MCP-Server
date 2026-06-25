import { ScrapeJob } from "./types";

class ScrapeStore {
  private jobs: Map<string, ScrapeJob> = new Map();

  createJob(job: ScrapeJob): void {
    this.jobs.set(job.id, job);
  }

  getJob(id: string): ScrapeJob | undefined {
    return this.jobs.get(id);
  }

  getAllJobs(): ScrapeJob[] {
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  updateJob(id: string, updates: Partial<ScrapeJob>): void {
    const job = this.jobs.get(id);
    if (job) {
      this.jobs.set(id, { ...job, ...updates });
    }
  }

  deleteJob(id: string): void {
    this.jobs.delete(id);
  }

  getStats() {
    const jobs = this.getAllJobs();
    const completed = jobs.filter((j) => j.status === "completed");
    const totalJobs = completed.reduce((acc, j) => acc + j.results.length, 0);
    const successRate =
      jobs.length > 0
        ? Math.round((completed.length / jobs.length) * 100)
        : 0;

    const avgTime =
      completed.length > 0
        ? Math.round(
            completed.reduce((acc, j) => {
              if (j.completedAt) {
                return (
                  acc +
                  (new Date(j.completedAt).getTime() -
                    new Date(j.createdAt).getTime()) /
                    1000
                );
              }
              return acc;
            }, 0) / completed.length
          )
        : 0;

    return {
      totalScrapeJobs: jobs.length,
      totalJobsFound: totalJobs,
      successRate,
      avgScrapeTime: avgTime,
    };
  }
}

// Singleton instance
const globalStore = globalThis as unknown as { __scrapeStore: ScrapeStore };
if (!globalStore.__scrapeStore) {
  globalStore.__scrapeStore = new ScrapeStore();
}

export const store = globalStore.__scrapeStore;
