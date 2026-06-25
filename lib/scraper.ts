import { chromium, Browser } from "playwright";
import { JobListing, ScrapeRequest } from "./types";
import { randomUUID } from "crypto";
import Groq from "groq-sdk";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Extract the city name from a full location string.
 * e.g. "Mumbai, Maharashtra, India" → "Mumbai"
 *      "India" → "India"
 *      "Noida, Uttar Pradesh, India" → "Noida"
 */
function extractCity(location: string): string {
  if (!location) return "Unknown";
  const parts = location.split(",").map((p) => p.trim());
  return parts[0] || "Unknown";
}

/**
 * Create a deduplication key from title + company.
 * Normalizes to lowercase and strips extra whitespace.
 */
function dedupeKey(title: string, company: string): string {
  return `${title.toLowerCase().trim()}|||${company.toLowerCase().trim()}`;
}

function buildLinkedInUrl(request: ScrapeRequest): string {
  const params = new URLSearchParams();
  params.set("keywords", request.keywords);

  if (request.location) {
    params.set("location", request.location);
  }

  if (request.jobType) {
    params.set("f_JT", request.jobType);
  }

  if (request.timePosted) {
    params.set("f_TPR", request.timePosted);
  }

  if (request.experienceLevel) {
    params.set("f_E", request.experienceLevel);
  }

  if (request.workType) {
    params.set("f_WT", request.workType);
  }

  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

export async function scrapeLinkedInJobs(
  request: ScrapeRequest,
  onProgress?: (progress: number, found: number) => void
): Promise<JobListing[]> {
  const maxResults = request.maxResults || 50;
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const context = await browser.newContext({
      userAgent: getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: "en-US",
    });

    // Block unnecessary resources for speed
    await context.route(
      /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/,
      (route) => route.abort()
    );

    const page = await context.newPage();

    const url = buildLinkedInUrl(request);
    console.log(`[Scraper] Navigating to: ${url}`);

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Wait for job cards to appear
    await page
      .waitForSelector(".jobs-search__results-list li, .base-card", {
        timeout: 15000,
      })
      .catch(() => {
        console.log(
          "[Scraper] Initial selector timeout, trying alternate selectors..."
        );
      });

    await randomDelay(2000, 4000);

    // Scroll to load more jobs
    // We unconditionally fetch a massive 5x buffer from LinkedIn because 
    // Deduplication and filters will throw away many irrelevant jobs
    const targetFetch = maxResults * 5;
    const scrollRounds = Math.min(Math.max(Math.ceil(targetFetch / 25), 3), 40);
    
    for (let i = 0; i < scrollRounds; i++) {
      await page.evaluate(() =>
        window.scrollTo(0, document.body.scrollHeight)
      );
      await randomDelay(1500, 3000);

      // Click "See more jobs" button if present
      try {
        const seeMoreBtn = page.locator(
          'button.infinite-scroller__show-more-button, button[aria-label="See more jobs"]'
        );
        if (await seeMoreBtn.isVisible({ timeout: 1000 })) {
          await seeMoreBtn.click();
          await randomDelay(2000, 3500);
        }
      } catch {
        // No more button, that's fine
      }

      if (onProgress) {
        onProgress(Math.round(((i + 1) / scrollRounds) * 50), 0);
      }
    }

    // Extract job listings
    const jobs = await page.evaluate(() => {
      const cards = document.querySelectorAll(
        ".jobs-search__results-list li, .base-card--link, ul.jobs-search__results-list > li"
      );

      const results: {
        title: string;
        company: string;
        companyLogo: string;
        location: string;
        jobUrl: string;
        postedTime: string;
        salary: string;
      }[] = [];

      cards.forEach((card) => {
        try {
          const titleEl =
            card.querySelector(".base-search-card__title") ||
            card.querySelector("h3.base-search-card__title") ||
            card.querySelector("h3") ||
            card.querySelector("[class*='job-title']");

          const companyEl =
            card.querySelector(".base-search-card__subtitle a") ||
            card.querySelector("h4.base-search-card__subtitle") ||
            card.querySelector("h4") ||
            card.querySelector("[class*='company-name']");

          const locationEl =
            card.querySelector(".job-search-card__location") ||
            card.querySelector("[class*='job-location']") ||
            card.querySelector("span.job-search-card__location");

          const linkEl =
            card.querySelector("a.base-card__full-link") ||
            card.querySelector("a[href*='/jobs/view/']") ||
            card.querySelector("a");

          const timeEl =
            card.querySelector("time") ||
            card.querySelector("[class*='listed-time']");

          const logoEl = card.querySelector("img");

          const salaryEl = card.querySelector(
            "[class*='salary'], [class*='compensation']"
          );

          const title = titleEl?.textContent?.trim() || "";
          const company = companyEl?.textContent?.trim() || "";
          const location = locationEl?.textContent?.trim() || "";
          const jobUrl = linkEl?.getAttribute("href") || "";
          const postedTime =
            timeEl?.getAttribute("datetime") ||
            timeEl?.textContent?.trim() ||
            "";
          const companyLogo = logoEl?.getAttribute("src") || "";
          const salary = salaryEl?.textContent?.trim() || "";

          if (title && company) {
            results.push({
              title,
              company,
              companyLogo,
              location,
              jobUrl: jobUrl.startsWith("http")
                ? jobUrl
                : `https://www.linkedin.com${jobUrl}`,
              postedTime,
              salary,
            });
          }
        } catch {
          // Skip malformed cards
        }
      });

      return results;
    });

    if (onProgress) {
      onProgress(55, jobs.length);
    }

    // ---- DEDUPLICATION: by title + company (case-insensitive) ----
    const seen = new Set<string>();
    let uniqueJobs = jobs.filter((job) => {
      const key = dedupeKey(job.title, job.company);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // ---- STRICT TITLE MATCH (SEMANTIC AI FILTER via GROQ) ----
    if (request.strictTitle) {
      if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not set in environment variables. Semantic filtering requires this key.");
      }
      
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      
      // Extract just the titles to send to the LLM to save tokens
      const jobTitles = uniqueJobs.map((job, index) => ({ id: index, title: job.title }));
      
      console.log(`[Scraper] Sending ${jobTitles.length} jobs to Groq for semantic filtering...`);
      onProgress?.(57, uniqueJobs.length);
      
      const prompt = `
      You are an expert AI recruiter assistant.
      The user is searching for a job with the exact keywords: "${request.keywords}".
      Below is a JSON array of job titles that a basic scraper found. Many of them are completely irrelevant to the actual field.
      Your task is to act as a Semantic Filter.
      
      Rules:
      1. Be lenient. Accept job IDs that are conceptually identical, highly synonymous, direct subsets, OR loosely related to the requested role.
      2. If the user searches for "AI", you SHOULD accept "Machine Learning", "Deep Learning", "Data Science", and "Computer Vision".
      3. If the user searches for "AI", you can ALSO ACCEPT generic tech roles (like "Software Engineer", "Backend Developer", "Data Analyst") because they often involve AI tasks.
      4. Pay strict attention to Seniority. If the user searches for "Intern" or "Fresher", you MUST ACCEPT "Intern", "New Grad", or "Fresher", but you MUST AGGRESSIVELY REJECT any mid-level or senior titles (e.g., "Senior", "Lead", "Manager", "Director", "VP").
      
      Here is the list of jobs:
      ${JSON.stringify(jobTitles, null, 2)}
      
      Return ONLY a JSON array of the integer IDs of the jobs that pass the semantic filter. Output nothing else but the JSON array. E.g. [0, 3, 14]
      `;

      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama-3.3-70b-versatile", // Upgraded to more capable model
          temperature: 0.1,
          response_format: { type: "json_object" } // Enforce JSON
        });

        // The model might return {"ids": [0, 3]} or just [0, 3] if we didn't specify schema. 
        // We will parse it carefully.
        const responseText = chatCompletion.choices[0]?.message?.content || "[]";
        let acceptedIds: number[] = [];
        
        try {
          const parsed = JSON.parse(responseText);
          if (Array.isArray(parsed)) {
            acceptedIds = parsed;
          } else if (parsed.ids && Array.isArray(parsed.ids)) {
            acceptedIds = parsed.ids;
          } else {
             // Fallback: extract numbers with regex
             const numbers = responseText.match(/\d+/g);
             if (numbers) acceptedIds = numbers.map(Number);
          }
        } catch (e) {
          console.error("[Scraper] Failed to parse Groq response:", responseText);
        }
        
        const originalCount = uniqueJobs.length;
        uniqueJobs = uniqueJobs.filter((_, index) => acceptedIds.includes(index));
        console.log(`[Scraper] Semantic Filter Complete: Kept ${uniqueJobs.length} out of ${originalCount} jobs.`);
        
      } catch (error) {
        console.error("[Scraper] Groq Semantic Filter failed:", error);
        console.warn("[Scraper] Falling back to non-semantic filtering due to API error.");
        // We just leave uniqueJobs as it is (no semantic filtering)
      }
    }

    console.log(
      `[Scraper] Deduplicated/Filtered: ${jobs.length} → ${uniqueJobs.length} unique jobs`
    );

    // Limit results
    const limited = uniqueJobs.slice(0, maxResults);

    if (onProgress) {
      onProgress(60, limited.length);
    }

    // ---- ENRICHMENT: get full description for ALL jobs ----
    const enrichedJobs: JobListing[] = [];

    for (let i = 0; i < limited.length; i++) {
      const job = limited[i];
      let description = "";
      let employmentType = "";
      let seniorityLevel = "";
      let applicants = "";
      let skills: string[] = [];

      try {
        await page.goto(job.jobUrl, {
          waitUntil: "domcontentloaded",
          timeout: 20000,
        });

        // Wait for the description to render
        await page
          .waitForSelector(
            ".show-more-less-html__markup, .description__text, .decorated-job-posting__details",
            { timeout: 8000 }
          )
          .catch(() => {});

        await randomDelay(1000, 2500);

        // Click "Show more" button if present to reveal full description
        try {
          const showMoreBtn = page.locator(
            'button.show-more-less-html__button--more, button[aria-label="Show more"], button:has-text("Show more")'
          );
          if (await showMoreBtn.isVisible({ timeout: 1500 })) {
            await showMoreBtn.click();
            await randomDelay(500, 1000);
          }
        } catch {
          // No show more button
        }

        const details = await page.evaluate(() => {
          // ---- DESCRIPTION: try multiple selectors for best coverage ----
          let desc = "";
          const descSelectors = [
            ".show-more-less-html__markup",
            ".description__text .show-more-less-html__markup",
            ".description__text",
            ".decorated-job-posting__details",
            "[class*='description'] .show-more-less-html__markup",
            "article .show-more-less-html__markup",
          ];

          for (const sel of descSelectors) {
            const el = document.querySelector(sel);
            if (el && el.innerHTML) {
              // Get inner HTML and convert to readable text
              const clone = el.cloneNode(true) as HTMLElement;
              // Replace <br> and block elements with newlines
              clone.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
              clone
                .querySelectorAll("li")
                .forEach((li) => (li.textContent = `• ${li.textContent}\n`));
              clone
                .querySelectorAll("p")
                .forEach((p) => (p.textContent = `${p.textContent}\n`));
              desc = clone.textContent?.trim() || "";
              if (desc.length > 50) break; // Good enough
            }
          }

          // ---- JOB CRITERIA: employment type, seniority ----
          const criteriaItems = document.querySelectorAll(
            ".description__job-criteria-item"
          );

          let empType = "";
          let seniority = "";

          criteriaItems.forEach((item) => {
            const header = item
              .querySelector(".description__job-criteria-subheader")
              ?.textContent?.trim()
              ?.toLowerCase();
            const value = item
              .querySelector(".description__job-criteria-text")
              ?.textContent?.trim();
            if (header?.includes("employment type")) empType = value || "";
            if (header?.includes("seniority")) seniority = value || "";
          });

          // ---- APPLICANTS ----
          let apps = "";
          const appSelectors = [
            ".num-applicants__caption",
            "[class*='num-applicants']",
            ".jobs-unified-top-card__applicant-count",
            "span.tvm__text:not(:empty)",
          ];
          for (const sel of appSelectors) {
            const el = document.querySelector(sel);
            const text = el?.textContent?.trim();
            if (text && (text.includes("applicant") || text.includes("click"))) {
              apps = text;
              break;
            }
          }

          // ---- SKILLS: extract from skills section if present ----
          const skillEls = document.querySelectorAll(
            ".job-details-skill-match-status-list li span, .job-details-how-you-match__skills-item-subtitle"
          );
          const skillsList: string[] = [];
          skillEls.forEach((el) => {
            const text = el.textContent?.trim();
            if (text && text.length < 50) skillsList.push(text);
          });

          return {
            description: desc,
            employmentType: empType,
            seniorityLevel: seniority,
            applicants: apps,
            skills: skillsList,
          };
        });

        description = details.description;
        employmentType = details.employmentType;
        seniorityLevel = details.seniorityLevel;
        applicants = details.applicants;
        skills = details.skills;
      } catch (err) {
        console.log(
          `[Scraper] Failed to enrich job ${i + 1}: ${err instanceof Error ? err.message : "unknown"}`
        );
      }

      const city = extractCity(job.location);

      enrichedJobs.push({
        id: randomUUID(),
        title: job.title,
        company: job.company,
        companyLogo: job.companyLogo,
        location: job.location,
        city,
        jobUrl: job.jobUrl,
        postedTime: job.postedTime,
        employmentType: employmentType || "Not specified",
        seniorityLevel,
        description,
        salary: job.salary,
        applicants,
        skills,
        scrapedAt: new Date().toISOString(),
      });

      if (onProgress) {
        onProgress(
          60 + Math.round(((i + 1) / limited.length) * 40),
          enrichedJobs.length
        );
      }
    }

    await browser.close();
    return enrichedJobs;
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}
