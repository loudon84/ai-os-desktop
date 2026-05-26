import { lazy, type ComponentType } from "react";
import type { HermesNavItemKey } from "../constants";

const SessionsPage = lazy(() => import("../pages/Sessions/HermesSessionsPage"));
const SkillsPage = lazy(() => import("../pages/Skills/HermesSkillsPage"));
const ToolsPage = lazy(() => import("../pages/Tools/HermesToolsPage"));
const MemoryPage = lazy(() => import("../pages/Memory/HermesMemoryPage"));
const ProvidersPage = lazy(() => import("../pages/Providers/HermesProvidersPage"));
const ModelsPage = lazy(() => import("../pages/Models/HermesModelsPage"));
const ChatPage = lazy(() => import("../pages/Chat/HermesDefaultChatPage"));

export type HermesPageKey = HermesNavItemKey;

export const HERMES_PAGE_REGISTRY: Record<HermesPageKey, ComponentType> = {
  chat: ChatPage,
  sessions: SessionsPage,
  skills: SkillsPage,
  tools: ToolsPage,
  memory: MemoryPage,
  providers: ProvidersPage,
  models: ModelsPage,
};
