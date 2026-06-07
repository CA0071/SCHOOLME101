/**
 * SCHOOLME101 MCP Server — Entry Point
 *
 * Exposes South African CAPS curriculum content as MCP tools and resources
 * for use with Claude Desktop, OpenClaw, and other MCP-compatible clients.
 *
 * Supported transports:
 *   - stdio  (default) — for Claude Desktop / OpenClaw
 *   - http   — set MCP_TRANSPORT=http and PORT=<n>
 */

import * as path from "path";
import * as fs from "fs";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { getCurriculum } from "./curriculum-loader.js";
import {
  getSubjectContent,
  searchCurriculum,
  getGradeOverview,
  getAiTutorInstructions,
  listAllSubjects,
  getSubjectByGrade,
  searchByTopic,
} from "./tools.js";
import {
  resourceSubjects,
  resourceGrade,
  resourceSubjectContent,
  resourceTutorInstructions,
  resourceSearchIndex,
} from "./resources.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CURRICULUM_DIR = path.resolve(
  process.env.CURRICULUM_PATH ?? path.join(__dirname, "..")
);

// ---------------------------------------------------------------------------
// Load curriculum once at startup
// ---------------------------------------------------------------------------

let entries = getCurriculum(CURRICULUM_DIR);

// ---------------------------------------------------------------------------
// Build MCP server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "schoolme101",
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

server.registerTool(
  "get_subject_content",
  {
    description:
      "Retrieve full CAPS curriculum content for a subject. Optionally filter by grade.",
    inputSchema: {
      subject: z.string().describe("Subject name, e.g. 'Mathematics'"),
      grade: z
        .string()
        .optional()
        .describe("Optional grade filter, e.g. 'Grade 7'"),
    },
  },
  async ({ subject, grade }) => ({
    content: [
      {
        type: "text",
        text: getSubjectContent(entries, subject, grade),
      },
    ],
  })
);

server.registerTool(
  "search_curriculum",
  {
    description:
      "Search across all CAPS curriculum subjects for a topic or keyword.",
    inputSchema: {
      query: z.string().describe("Search query"),
      grade: z
        .string()
        .optional()
        .describe("Optional grade to restrict search to, e.g. 'Grade 10'"),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("Maximum number of results to return (default 10)"),
    },
  },
  async ({ query, grade, maxResults }) => ({
    content: [
      {
        type: "text",
        text: searchCurriculum(entries, query, grade, maxResults),
      },
    ],
  })
);

server.registerTool(
  "get_grade_overview",
  {
    description:
      "Get all subjects available for a specific grade, with the school phase.",
    inputSchema: {
      grade: z
        .string()
        .describe("Grade string, e.g. 'Grade R', 'Grade 7', 'Grade 12'"),
    },
  },
  async ({ grade }) => ({
    content: [
      {
        type: "text",
        text: getGradeOverview(entries, grade),
      },
    ],
  })
);

server.registerTool(
  "get_ai_tutor_instructions",
  {
    description:
      "Retrieve the AI tutor guidelines for age-appropriate CAPS tutoring.",
    inputSchema: {},
  },
  async () => ({
    content: [
      {
        type: "text",
        text: getAiTutorInstructions(CURRICULUM_DIR),
      },
    ],
  })
);

server.registerTool(
  "list_all_subjects",
  {
    description:
      "Get the complete list of all CAPS subjects with their grade and phase.",
    inputSchema: {},
  },
  async () => ({
    content: [
      {
        type: "text",
        text: listAllSubjects(entries),
      },
    ],
  })
);

server.registerTool(
  "get_subject_by_grade",
  {
    description:
      "Get specific subject curriculum content for an exact grade combination.",
    inputSchema: {
      subject: z.string().describe("Subject name, e.g. 'Physical Sciences'"),
      grade: z.string().describe("Exact grade, e.g. 'Grade 11'"),
    },
  },
  async ({ subject, grade }) => ({
    content: [
      {
        type: "text",
        text: getSubjectByGrade(entries, subject, grade),
      },
    ],
  })
);

server.registerTool(
  "search_by_topic",
  {
    description:
      "Deep topic search across curriculum. Optionally filter by grade and/or subject.",
    inputSchema: {
      topic: z.string().describe("Topic to search for"),
      grade: z
        .string()
        .optional()
        .describe("Optional grade filter, e.g. 'Grade 9'"),
      subject: z
        .string()
        .optional()
        .describe("Optional subject filter, e.g. 'Life Sciences'"),
    },
  },
  async ({ topic, grade, subject }) => ({
    content: [
      {
        type: "text",
        text: searchByTopic(entries, topic, grade, subject),
      },
    ],
  })
);

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

server.resource(
  "subjects",
  "schoolme://subjects",
  { description: "List of all available CAPS subjects" },
  async () => {
    const r = resourceSubjects(entries);
    return {
      contents: [
        { uri: "schoolme://subjects", mimeType: r.mimeType, text: r.text },
      ],
    };
  }
);

server.resource(
  "tutor-instructions",
  "schoolme://tutor-instructions",
  { description: "AI tutor instructions for CAPS curriculum" },
  async () => {
    const r = resourceTutorInstructions(CURRICULUM_DIR);
    return {
      contents: [
        {
          uri: "schoolme://tutor-instructions",
          mimeType: r.mimeType,
          text: r.text,
        },
      ],
    };
  }
);

server.resource(
  "curriculum-search-index",
  "schoolme://curriculum/search",
  { description: "Lightweight search index of all curriculum entries" },
  async () => {
    const r = resourceSearchIndex(entries);
    return {
      contents: [
        {
          uri: "schoolme://curriculum/search",
          mimeType: r.mimeType,
          text: r.text,
        },
      ],
    };
  }
);

server.resource(
  "grade",
  new ResourceTemplate("schoolme://grades/{grade}", { list: undefined }),
  { description: "Subjects available for a specific grade" },
  async (uri, { grade }) => {
    const gradeStr = Array.isArray(grade) ? grade[0] : grade ?? "";
    const r = resourceGrade(entries, decodeURIComponent(gradeStr));
    return {
      contents: [{ uri: uri.href, mimeType: r.mimeType, text: r.text }],
    };
  }
);

server.resource(
  "subject",
  new ResourceTemplate("schoolme://subject/{subjectName}", { list: undefined }),
  { description: "Full curriculum content for a named subject" },
  async (uri, { subjectName }) => {
    const nameStr = Array.isArray(subjectName)
      ? subjectName[0]
      : subjectName ?? "";
    const r = resourceSubjectContent(entries, decodeURIComponent(nameStr));
    return {
      contents: [{ uri: uri.href, mimeType: r.mimeType, text: r.text }],
    };
  }
);

// ---------------------------------------------------------------------------
// Transport & launch
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const transport = process.env.MCP_TRANSPORT ?? "stdio";

  if (transport === "stdio") {
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    // Write a startup message to stderr so it does not pollute the MCP stdio stream
    process.stderr.write(
      `SCHOOLME101 MCP server running on stdio (${entries.length} subjects loaded)\n`
    );
  } else {
    // HTTP / SSE transport — requires additional server framework setup
    process.stderr.write(
      `HTTP transport is not yet enabled. Set MCP_TRANSPORT=stdio.\n`
    );
    process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(`Fatal error: ${err}\n`);
  process.exit(1);
});
