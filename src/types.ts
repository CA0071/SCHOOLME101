import { z, type ZodTypeAny } from "zod";

export type ToolHandlerKind = "curriculum" | "discovery" | "proxy";

export interface ServerDefinition {
  id: string;
  category: string;
  tools: number;
  resources: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  serverId: string;
  handlerKind: ToolHandlerKind;
  inputSchema: Record<string, ZodTypeAny>;
}

export interface CurriculumSubject {
  grade: string;
  subject: string;
  filePath: string;
  content: string;
}

export interface ResourcePayload {
  uri: string;
  mimeType: string;
  text: string;
}

export const emptySchema: Record<string, ZodTypeAny> = {};

export const gradeAndSubjectSchema = {
  grade: z.string().min(1),
  subject: z.string().min(1)
};
