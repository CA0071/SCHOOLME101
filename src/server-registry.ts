import config from "../server-config.json" with { type: "json" };
import { emptySchema, gradeAndSubjectSchema, ServerDefinition, ToolDefinition } from "./types.js";
import { z } from "zod";

const DISCOVERY_TOOLS: ToolDefinition[] = [
  {
    name: "list_all_servers",
    description: "List metadata for all registered MCP servers.",
    category: "meta",
    serverId: "schoolme-unified",
    handlerKind: "discovery",
    inputSchema: emptySchema
  },
  {
    name: "list_tools_by_category",
    description: "List all tools grouped by category.",
    category: "meta",
    serverId: "schoolme-unified",
    handlerKind: "discovery",
    inputSchema: emptySchema
  },
  {
    name: "get_tool_documentation",
    description: "Get full documentation for a tool by name.",
    category: "meta",
    serverId: "schoolme-unified",
    handlerKind: "discovery",
    inputSchema: { tool_name: gradeAndSubjectSchema.subject }
  },
  {
    name: "get_server_status",
    description: "Get status and availability metadata for each server.",
    category: "meta",
    serverId: "schoolme-unified",
    handlerKind: "discovery",
    inputSchema: emptySchema
  },
  {
    name: "list_capabilities",
    description: "Return merged capability matrix across all categories.",
    category: "meta",
    serverId: "schoolme-unified",
    handlerKind: "discovery",
    inputSchema: emptySchema
  }
];

const SCHOOLME_TOOLS: ToolDefinition[] = [
  {
    name: "get_subject_content",
    description: "Get full curriculum markdown content for a subject with optional grade.",
    category: "education",
    serverId: "schoolme101",
    handlerKind: "curriculum",
    inputSchema: {
      subject: gradeAndSubjectSchema.subject,
      grade: gradeAndSubjectSchema.grade.optional()
    }
  },
  {
    name: "search_curriculum",
    description: "Search curriculum content by keyword and optional filters.",
    category: "education",
    serverId: "schoolme101",
    handlerKind: "curriculum",
    inputSchema: {
      query: gradeAndSubjectSchema.subject,
      grade: gradeAndSubjectSchema.grade.optional(),
      limit: z.number().int().positive().max(100).optional()
    }
  },
  {
    name: "get_grade_overview",
    description: "List all subjects available for a grade.",
    category: "education",
    serverId: "schoolme101",
    handlerKind: "curriculum",
    inputSchema: { grade: gradeAndSubjectSchema.grade }
  },
  {
    name: "get_ai_tutor_instructions",
    description: "Return AI tutor instruction guidelines.",
    category: "education",
    serverId: "schoolme101",
    handlerKind: "curriculum",
    inputSchema: emptySchema
  },
  {
    name: "list_all_subjects",
    description: "List all subjects with grade metadata.",
    category: "education",
    serverId: "schoolme101",
    handlerKind: "curriculum",
    inputSchema: emptySchema
  },
  {
    name: "get_subject_by_grade",
    description: "Lookup exact subject by grade.",
    category: "education",
    serverId: "schoolme101",
    handlerKind: "curriculum",
    inputSchema: gradeAndSubjectSchema
  },
  {
    name: "search_by_topic",
    description: "Search a topic across curriculum with optional grade and subject filters.",
    category: "education",
    serverId: "schoolme101",
    handlerKind: "curriculum",
    inputSchema: {
      topic: gradeAndSubjectSchema.subject,
      grade: gradeAndSubjectSchema.grade.optional(),
      subject: gradeAndSubjectSchema.subject.optional(),
      limit: z.number().int().positive().max(100).optional()
    }
  }
];

export const SERVERS: ServerDefinition[] = config.servers as ServerDefinition[];

function buildGeneratedTools(): ToolDefinition[] {
  const generated: ToolDefinition[] = [];
  for (const server of SERVERS) {
    if (server.id === "schoolme101") continue;
    for (let i = 1; i <= server.tools; i += 1) {
      generated.push({
        name: `${server.id}_tool_${i}`,
        description: `Unified proxy entry for ${server.id} tool ${i}.`,
        category: server.category,
        serverId: server.id,
        handlerKind: "proxy",
        inputSchema: emptySchema
      });
    }
  }
  return generated;
}

let cachedTools: ToolDefinition[] | null = null;

export function allTools(): ToolDefinition[] {
  if (cachedTools) return cachedTools;
  cachedTools = [...SCHOOLME_TOOLS, ...DISCOVERY_TOOLS, ...buildGeneratedTools()];
  return cachedTools;
}

export function toolsByCategory(): Record<string, ToolDefinition[]> {
  return allTools().reduce<Record<string, ToolDefinition[]>>((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {});
}

export function toolByName(name: string): ToolDefinition | undefined {
  return allTools().find((tool) => tool.name === name);
}

export function categories(): string[] {
  return [...new Set(SERVERS.map((server) => server.category))].sort((a, b) => a.localeCompare(b));
}
