export type ChatbotRole = 'system' | 'user' | 'assistant';

export interface ChatbotMessage {
  id: string;
  role: ChatbotRole;
  content: string;
  createdAt: number;
  sources?: ChatbotSource[];
}

export interface ChatbotSource {
  docUrl: string;
  docName: string;
  chunkIndex: number;
  score: number;
  excerpt: string;
}

export interface ChatbotSuggestion {
  id: string;
  labelKey: string;
  promptKey?: string;
  assistantKey?: string;
  followUps?: ChatbotSuggestion[];
}

export interface ChatbotConfig {
  appName: string;
  docs: { url: string; name: string }[];
  maxSources: number;
  suggestions?: ChatbotSuggestion[];
  ai: {
    baseUrl: string;
    apiKey?: string;
    model: string;
    enabled: boolean;
  };
}

export interface ChatbotAskResult {
  answer: string;
  sources: ChatbotSource[];
}
