import { ChatSession, AppConfig } from '../types';

const STORAGE_KEY = 'lumina_chat_sessions';
const CONFIG_KEY = 'lumina_app_config';

// --- Session Management ---

export const getSessions = (): ChatSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load sessions", e);
    return [];
  }
};

export const getSession = (id: string): ChatSession | undefined => {
  const sessions = getSessions();
  return sessions.find(s => s.id === id);
};

export const saveSession = (session: ChatSession): void => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  
  if (index >= 0) {
    // Update existing, move to top
    sessions.splice(index, 1);
    sessions.unshift(session);
  } else {
    // Add new to top
    sessions.unshift(session);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export const deleteSession = (id: string): void => {
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

// --- Config Management ---

export const getAppConfig = (): AppConfig => {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load config", e);
  }

  // Default Config
  return {
    provider: 'google',
    googleKey: '',
    openRouterKey: '',
    selectedModelId: 'gemini-3-flash-preview'
  };
};

export const saveAppConfig = (config: AppConfig): void => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const getActiveApiKey = (): string => {
  const config = getAppConfig();
  return config.provider === 'google' ? config.googleKey : config.openRouterKey;
};