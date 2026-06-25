import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { scrapeLinkedInJobs } from "./lib/scraper.js";

// Redirect all console.log output to stderr.
// This is critical for stdio MCP servers, as any non-JSON output on stdout will break the protocol!
const originalLog = console.log;
console.log = (...args) => console.error(...args);
const originalInfo = console.info;
console.info = (...args) => console.error(...args);

// Load environment variables silently
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
(dotenv.config as any)({ path: path.join(__dirname, ".env.local"), quiet: true });
(dotenv.config as any)({ path: path.join(__dirname, ".env.local"), quiet: true });

const server = new Server(
  {
    name: "LinkedInScraperMCP",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "scrape_jobs",
        description: "Scrape job listings from LinkedIn based on criteria. It returns a list of unique jobs.",
        inputSchema: {
          type: "object",
          properties: {
            keywords: { type: "string", description: "The job title or keywords to search for." },
            location: { type: "string", description: "The location to search in (e.g., 'United States'). Default is 'Worldwide'." },
            jobType: { type: "string", description: "Job type code: 'F' (Full-time), 'C' (Contract)." },
            timePosted: { type: "string", description: "Time posted code: 'r86400' (Past 24 hours), 'r604800' (Past week)." },
            experienceLevel: { type: "string", description: "Experience code: '1' (Internship), '2' (Entry level), '3' (Associate), '4' (Mid-Senior), '5' (Director)." },
            workType: { type: "string", description: "Work type code: '1' (On-site), '2' (Remote), '3' (Hybrid)." },
            strictTitle: { type: "boolean", description: "Whether to use LLM semantic filtering to strictly match titles." },
            maxResults: { type: "number", description: "Maximum number of results to return. Default is 25." }
          },
          required: ["keywords"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "scrape_jobs") {
    const args = request.params.arguments as any;
    
    try {
      const jobs = await scrapeLinkedInJobs({
        keywords: args.keywords,
        location: args.location || "Worldwide",
        jobType: args.jobType,
        timePosted: args.timePosted,
        experienceLevel: args.experienceLevel,
        workType: args.workType,
        strictTitle: args.strictTitle || false,
        maxResults: args.maxResults || 25,
      });

      return {
        content: [{ type: "text", text: JSON.stringify(jobs, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error executing scrape_jobs: ${error.message}` }],
        isError: true,
      };
    }
  }

  throw new Error(`Tool not found: ${request.params.name}`);
});

// Setup Stdio transport
const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
