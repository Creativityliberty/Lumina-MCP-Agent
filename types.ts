export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isError?: boolean;
  attachmentName?: string;
}

export interface ScrapedPage {
  title: string;
  url: string;
  category: 'Docs' | 'API' | 'Guide' | 'Other';
  status: 'indexed' | 'pending';
}

export interface MCPConfig {
  serverName: string;
  baseUrl: string;
  tool: 'cursor' | 'claude' | 'windsurf' | 'vscode';
}

export type AppView = 'home' | 'triage' | 'chat' | 'settings' | 'architecture' | 'history';

export interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: Message[];
  contextUrl?: string;
}

export type AIProvider = 'google' | 'openrouter';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  description?: string;
  isFree?: boolean;
}

export interface AppConfig {
  provider: AIProvider;
  googleKey: string;
  openRouterKey: string;
  selectedModelId: string;
}