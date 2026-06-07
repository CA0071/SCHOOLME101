import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CurriculumLoader } from "./curriculum-loader.js";
import { ResourceRouter } from "./resource-router.js";
import { allTools } from "./server-registry.js";
import { ToolRouter } from "./tool-router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const loader = new CurriculumLoader(repoRoot);
const toolRouter = new ToolRouter(loader);
const resourceRouter = new ResourceRouter(loader);

const server = new McpServer({
  name: "schoolme-unified",
  version: "1.0.0"
});

for (const tool of allTools()) {
  server.tool(tool.name, tool.description, tool.inputSchema, async (args) => {
    return toolRouter.handle(tool.name, args as Record<string, unknown>);
  });
}

const staticResources = [
  "schoolme://",
  "schoolme://servers",
  "schoolme://tools",
  "schoolme://subjects",
  "schoolme://tutor-instructions",
  "schoolme://curriculum/search",
  ...loader.grades().map((grade) => `schoolme://grades/${encodeURIComponent(grade)}`),
  ...loader.loadSubjects().map((item) => `schoolme://subject/${encodeURIComponent(item.subject)}`)
];

for (const uri of staticResources) {
  const resourceName = uri.replace("schoolme://", "schoolme-") || "schoolme-root";
  server.resource(resourceName, uri, async (resourceUri) => {
    const payload = resourceRouter.read(resourceUri.href);
    return {
      contents: [
        {
          uri: payload.uri,
          mimeType: payload.mimeType,
          text: payload.text
        }
      ]
    };
  });
}

const categories = [
  "education",
  "whatsapp",
  "database",
  "cloud",
  "browser",
  "tts",
  "image",
  "ocr",
  "memory",
  "research",
  "other"
];

for (const category of categories) {
  for (const suffix of ["", "/overview"]) {
    const uri = `schoolme://${category}${suffix}`;
    server.resource(`schoolme-${category}${suffix || "-root"}`.replace(/[\/]/g, "-"), uri, async (resourceUri) => {
      const payload = resourceRouter.read(resourceUri.href);
      return {
        contents: [{ uri: payload.uri, mimeType: payload.mimeType, text: payload.text }]
      };
    });
  }

  const categoryToolUri = `schoolme://tools/${category}`;
  const categoryServerUri = `schoolme://servers/${category}`;
  server.resource(`schoolme-tools-${category}`, categoryToolUri, async (resourceUri) => {
    const payload = resourceRouter.read(resourceUri.href);
    return { contents: [{ uri: payload.uri, mimeType: payload.mimeType, text: payload.text }] };
  });
  server.resource(`schoolme-servers-${category}`, categoryServerUri, async (resourceUri) => {
    const payload = resourceRouter.read(resourceUri.href);
    return { contents: [{ uri: payload.uri, mimeType: payload.mimeType, text: payload.text }] };
  });
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  process.stderr.write(`Fatal server error: ${String(error)}\n`);
  process.exit(1);
});
