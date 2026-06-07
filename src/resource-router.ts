import { CurriculumLoader } from "./curriculum-loader.js";
import { categories, SERVERS, toolsByCategory } from "./server-registry.js";
import { ResourcePayload } from "./types.js";

function json(uri: string, body: unknown): ResourcePayload {
  return {
    uri,
    mimeType: "application/json",
    text: JSON.stringify(body, null, 2)
  };
}

export class ResourceRouter {
  constructor(private readonly loader: CurriculumLoader) {}

  read(uri: string): ResourcePayload {
    if (!uri.startsWith("schoolme://")) {
      return json(uri, { ok: false, message: "Unsupported URI scheme." });
    }

    const path = uri.replace("schoolme://", "");

    if (path === "") {
      return json(uri, {
        name: "schoolme-unified",
        servers: SERVERS.length,
        categories: categories(),
        tools: Object.values(toolsByCategory()).reduce((acc, list) => acc + list.length, 0)
      });
    }

    if (path === "servers") return json(uri, SERVERS);
    if (path.startsWith("servers/")) {
      const category = path.slice("servers/".length);
      return json(uri, SERVERS.filter((entry) => entry.category === category));
    }

    if (path === "tools") {
      return json(uri, Object.fromEntries(Object.entries(toolsByCategory()).map(([k, v]) => [k, v.map((t) => t.name)])));
    }

    if (path.startsWith("tools/")) {
      const category = path.slice("tools/".length);
      const tools = toolsByCategory()[category] ?? [];
      return json(uri, tools.map((tool) => ({ name: tool.name, description: tool.description, server: tool.serverId })));
    }

    if (path === "subjects") {
      return json(uri, this.loader.loadSubjects().map((item) => item.subject));
    }

    if (path.startsWith("grades/")) {
      const grade = decodeURIComponent(path.slice("grades/".length));
      const subjects = this.loader
        .loadSubjects()
        .filter((item) => item.grade.toLowerCase() === grade.toLowerCase())
        .map((item) => item.subject);
      return json(uri, { grade, subjects });
    }

    if (path.startsWith("subject/")) {
      const subject = decodeURIComponent(path.slice("subject/".length));
      const item = this.loader.findSubject(subject);
      if (!item) return json(uri, { found: false, message: "Subject not found." });
      return {
        uri,
        mimeType: "text/markdown",
        text: item.content
      };
    }

    if (path === "tutor-instructions") {
      return {
        uri,
        mimeType: "text/markdown",
        text: this.loader.loadTutorInstructions()
      };
    }

    if (path === "curriculum/search") {
      const index = this.loader.loadSubjects().map((item) => ({ grade: item.grade, subject: item.subject }));
      return json(uri, index);
    }

    const [category] = path.split("/");
    if (categories().includes(category)) {
      const categoryServers = SERVERS.filter((entry) => entry.category === category);
      return json(uri, {
        category,
        servers: categoryServers.map((entry) => entry.id),
        tools: categoryServers.reduce((acc, entry) => acc + entry.tools, 0),
        resources: categoryServers.reduce((acc, entry) => acc + entry.resources, 0)
      });
    }

    return json(uri, { ok: false, message: `Unknown resource path: ${path}` });
  }
}
