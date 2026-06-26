import { lazy, type ComponentType } from "react";
import type { HermesNavItemKey } from "../constants";

const SessionsPage = lazy(() => import("../pages/Sessions/HermesSessionsPage"));
const SkillsPage = lazy(() => import("../pages/Skills/HermesSkillsPage"));
const ToolsPage = lazy(() => import("../pages/Tools/HermesToolsPage"));
const MemoryPage = lazy(() => import("../pages/Memory/HermesMemoryPage"));
const ProvidersPage = lazy(() => import("../pages/Providers/HermesProvidersPage"));
const ModelsPage = lazy(() => import("../pages/Models/HermesModelsPage"));
const ChatPage = lazy(() => import("../pages/Chat/HermesDefaultChatPage"));
const ExpertsPage = lazy(() => import("../pages/Experts/HermesExpertsPage"));
const ExpertTeamsPage = lazy(() => import("../pages/ExpertTeams/HermesExpertTeamsPage"));
const ExpertRunsPage = lazy(() => import("../pages/ExpertRuns/HermesExpertRunsPage"));
const McpPage = lazy(() => import("../pages/MCP/HermesMCPPage"));
const McpGatewayPage = lazy(() => import("../pages/McpGateway/HermesMcpGatewayPage"));
const GeneHubSkillCenterPage = lazy(() => import("../pages/GeneHub/GeneHubSkillCenterPage"));

export type HermesPageKey = HermesNavItemKey;

export const HERMES_PAGE_REGISTRY: Record<HermesPageKey, ComponentType> = {
  chat: ChatPage,
  experts: ExpertsPage,
  expertTeams: ExpertTeamsPage,
  expertRuns: ExpertRunsPage,
  sessions: SessionsPage,
  skills: SkillsPage,
  skillCenter: GeneHubSkillCenterPage,
  mcp: McpPage,
  mcpGateway: McpGatewayPage,
  tools: ToolsPage,
  memory: MemoryPage,
  providers: ProvidersPage,
  models: ModelsPage,
};
