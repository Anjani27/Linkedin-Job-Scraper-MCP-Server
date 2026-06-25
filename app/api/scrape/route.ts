import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { store } from "@/lib/store";
import { scrapeLinkedInJobs } from "@/lib/scraper";
import { ScrapeJob, ScrapeRequest } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body: ScrapeRequest = await req.json();

    if (!body.keywords || body.keywords.trim() === "") {
      return NextResponse.json(
        { error: "Keywords are required" },
        { status: 400 }
      );
    }

    const jobId = randomUUID();
    const scrapeJob: ScrapeJob = {
      id: jobId,
      status: "queued",
      request: body,
      results: [],
      createdAt: new Date().toISOString(),
      progress: 0,
    };

    store.createJob(scrapeJob);

    // Run scraper in background (non-blocking)
    (async () => {
      try {
        store.updateJob(jobId, { status: "running", progress: 5 });

        const results = await scrapeLinkedInJobs(body, (progress, found) => {
          store.updateJob(jobId, { progress });
        });

        store.updateJob(jobId, {
          status: "completed",
          results,
          progress: 100,
          completedAt: new Date().toISOString(),
        });
      } catch (error: unknown) {
        const errMsg =
          error instanceof Error ? error.message : "Unknown error occurred";
        store.updateJob(jobId, {
          status: "failed",
          error: errMsg,
          progress: 0,
          completedAt: new Date().toISOString(),
        });
      }
    })();

    return NextResponse.json({ id: jobId, status: "queued" }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function GET() {
  const jobs = store.getAllJobs();
  const stats = store.getStats();
  return NextResponse.json({ jobs, stats });
}
