import type { LucideIcon } from "lucide-react";

export interface ToolConfig {
  name: string;
  Icon: LucideIcon;
  color: string;
  description: string;
  toolRole: string;
  mode: "chat" | "structure" | "security";
  suggestedQuestions: readonly string[];
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface StructureFinding {
  severity: "error" | "warning" | "info";
  rule: string;
  message: string;
  suggestion: string;
  path?: string;
}

export interface StructureResult {
  framework: string;
  findings: StructureFinding[];
  summary: string;
  folderTree?: string;
}

export interface SecurityFinding {
  severity: "critical" | "high" | "medium" | "low";
  rule: string;
  message: string;
  suggestion: string;
  path?: string;
  snippet?: string;
}

export interface SecurityStats {
  filesScanned: number;
  rulesChecked: number;
  categories: { name: string; checked: number; passed: number }[];
  fileTypes: { ext: string; count: number }[];
}

export interface SecurityResult {
  findings: SecurityFinding[];
  summary: string;
  score: number;
  stats?: SecurityStats;
}

export type PageState =
  | "input"
  | "confirming"
  | "ingesting"
  | "ready"
  | "error";
