import { Provider } from '@angular/core';
import { CHATBOT_CONFIG } from './chatbot.tokens';
import { ChatbotConfig } from './chatbot.types';

export function provideChatbot(config: ChatbotConfig): Provider[] {
  return [
    {
      provide: CHATBOT_CONFIG,
      useValue: config,
    }
  ];
}
