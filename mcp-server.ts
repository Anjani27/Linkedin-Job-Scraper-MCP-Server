import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import next from "next";
import { scrapeLinkedInJobs } from "./lib/scraper.js";

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

// Load environment variables (mimicking Next.js loading .env.local)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env.local") });

console.log("Environment variables loaded.");

nextApp.prepare().then(() => {
  const app = express();
  app.use(cors()); // Allow web-based MCP clients to connect!
  const port = 7860;

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

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "scrape_jobs",
        description: "Scrape job listings from LinkedIn based on criteria. It returns a list of unique jobs.",
        inputSchema: {
          type: "object",
          properties: {
            keywords: {
              type: "string",
              description: "The job title or keywords to search for (e.g., 'Software Engineer').",
            },
            location: {
              type: "string",
              description: "The location to search in (e.g., 'United States'). Default is 'Worldwide'.",
            },
            jobType: {
              type: "string",
              description: "Job type code: 'F' (Full-time), 'C' (Contract), 'I' (Internship), 'P' (Part-time).",
            },
            timePosted: {
              type: "string",
              description: "Time posted code: 'r86400' (Past 24 hours), 'r604800' (Past week), 'r2592000' (Past month).",
            },
            experienceLevel: {
              type: "string",
              description: "Experience code: '1' (Internship), '2' (Entry level), '3' (Associate), '4' (Mid-Senior), '5' (Director).",
            },
            strictTitle: {
              type: "boolean",
              description: "Whether to use LLM semantic filtering to strictly match titles.",
            },
            maxResults: {
              type: "number",
              description: "Maximum number of results to return. Default is 25.",
            }
          },
          required: ["keywords"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "scrape_jobs") {
    const args = request.params.arguments as any;

    try {
      console.log(`[MCP] Executing scrape_jobs with args:`, args);
      const jobs = await scrapeLinkedInJobs({
        keywords: args.keywords,
        location: args.location || "Worldwide",
        jobType: args.jobType,
        timePosted: args.timePosted,
        experienceLevel: args.experienceLevel,
        strictTitle: args.strictTitle || false,
        maxResults: args.maxResults || 25,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(jobs, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error("[MCP] Error in scrape_jobs:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error executing scrape_jobs: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Tool not found: ${request.params.name}`);
});

// Setup Express SSE routes
let transport: SSEServerTransport;

app.get("/mcp", async (req, res) => {
  console.log("[MCP] New SSE connection established");
  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});

  app.post("/message", async (req, res) => {
    console.log("[MCP] Received message on /message");
    if (!transport) {
      res.status(500).send("Session not initialized");
      return;
    }
    await transport.handlePostMessage(req, res);
  });

  // Let Next.js handle all other routes (the frontend UI)
  app.use((req, res) => {
    return handle(req, res);
  });

  app.listen(port, () => {
    console.log(`[Next.js + MCP] Server listening on port ${port}`);
    console.log(`[MCP Endpoint] http://localhost:${port}/mcp`);
    console.log(`[Web Frontend] http://localhost:${port}/`);
  });
});
