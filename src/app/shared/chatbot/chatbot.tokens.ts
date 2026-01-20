import { InjectionToken } from '@angular/core';
import { ChatbotConfig } from './chatbot.types';

export const CHATBOT_CONFIG = new InjectionToken<ChatbotConfig>('CHATBOT_CONFIG');
