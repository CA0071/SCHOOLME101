import { Schoolme101ToolHandler } from "./handlers/education/schoolme101-tools.js";
import { allTools, categories, SERVERS, toolByName, toolsByCategory } from "./server-registry.js";
function asResult(data) {
    return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        structuredContent: { result: data }
    };
}
export class ToolRouter {
    schoolmeHandler;
    constructor(loader) {
        this.schoolmeHandler = new Schoolme101ToolHandler(loader);
    }
    async handle(toolName, args) {
        const definition = toolByName(toolName);
        if (!definition) {
            return asResult({ ok: false, message: `Unknown tool: ${toolName}` });
        }
        if (definition.handlerKind === "curriculum") {
            return this.schoolmeHandler.handle(toolName, args);
        }
        if (definition.handlerKind === "discovery") {
            return this.handleDiscovery(toolName, args);
        }
        return asResult({
            ok: true,
            proxied: true,
            server: definition.serverId,
            category: definition.category,
            tool: definition.name,
            note: "Tool is registered in unified meta-server. Connect provider credentials/environment to enable upstream execution.",
            input: args
        });
    }
    handleDiscovery(toolName, args) {
        switch (toolName) {
            case "list_all_servers":
                return asResult({ count: SERVERS.length, servers: SERVERS });
            case "list_tools_by_category": {
                const grouped = Object.entries(toolsByCategory()).reduce((acc, [key, value]) => {
                    acc[key] = value.map((tool) => tool.name);
                    return acc;
                }, {});
                return asResult({ categories: grouped });
            }
            case "get_tool_documentation": {
                const toolNameArg = String(args.tool_name ?? "");
                const tool = toolByName(toolNameArg);
                if (!tool)
                    return asResult({ found: false, message: `Tool not found: ${toolNameArg}` });
                return asResult({ found: true, tool });
            }
            case "get_server_status":
                return asResult({
                    servers: SERVERS.map((server) => ({
                        id: server.id,
                        category: server.category,
                        status: "registered",
                        tools: server.tools,
                        resources: server.resources
                    }))
                });
            case "list_capabilities": {
                const categorySet = categories();
                const matrix = categorySet.map((category) => {
                    const servers = SERVERS.filter((entry) => entry.category === category);
                    return {
                        category,
                        servers: servers.map((entry) => entry.id),
                        toolCount: servers.reduce((acc, entry) => acc + entry.tools, 0),
                        resourceCount: servers.reduce((acc, entry) => acc + entry.resources, 0)
                    };
                });
                return asResult({ totalServers: SERVERS.length, totalTools: allTools().length, matrix });
            }
            default:
                return asResult({ ok: false, message: `Unsupported discovery tool: ${toolName}` });
        }
    }
}
