import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import Papa from "papaparse";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const format = req.nextUrl.searchParams.get("format") || "json";
  const job = store.getJob(id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "completed" || job.results.length === 0) {
    return NextResponse.json(
      { error: "No results available for export" },
      { status: 400 }
    );
  }

  if (format === "csv") {
    const csvData = job.results.map((r) => ({
      Title: r.title,
      Company: r.company,
      City: r.city || "",
      Location: r.location,
      "Employment Type": r.employmentType,
      "Seniority Level": r.seniorityLevel || "",
      "Posted Time": r.postedTime,
      Salary: r.salary || "",
      Applicants: r.applicants || "",
      Skills: r.skills?.join(", ") || "",
      "Job URL": r.jobUrl,
      Description: r.description?.substring(0, 2000) || "",
      "Scraped At": r.scrapedAt,
    }));

    const csv = Papa.unparse(csvData);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="linkedin-jobs-${id.slice(0, 8)}.csv"`,
      },
    });
  }

  // Default: JSON
  return new NextResponse(JSON.stringify(job.results, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="linkedin-jobs-${id.slice(0, 8)}.json"`,
    },
  });
}
