import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { CHATBOT_CONFIG } from './chatbot.tokens';
import { ChatbotMessage, ChatbotSuggestion } from './chatbot.types';
import { ChatbotService } from './chatbot.service';
import { createId } from './chatbot.util';

@Component({
  selector: 'chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './chatbot-widget.html',
  styleUrl: './chatbot-widget.scss'
})
export class ChatbotWidget {
  private config = inject(CHATBOT_CONFIG);
  private chatbot = inject(ChatbotService);
  private translate = inject(TranslateService);

  isOpen = signal(false);
  isWorking = signal(false);
  input = signal('');

  messages = signal<ChatbotMessage[]>([]);
  suggestions = signal<ChatbotSuggestion[]>([]);
  private rootSuggestions: ChatbotSuggestion[] = [];

  ngOnInit() {
    this.rootSuggestions = this.config.suggestions ?? [];
    this.suggestions.set(this.rootSuggestions);

    const greeting: ChatbotMessage = {
      id: createId('msg'),
      role: 'assistant',
      content: this.translate.instant('CHATBOT.GREETING', { appName: this.config.appName }),
      createdAt: Date.now()
    };

    this.messages.set([greeting]);
  }

  toggle() {
    this.isOpen.set(!this.isOpen());
  }

  close() {
    this.isOpen.set(false);
  }

  async send() {
    const content = this.input().trim();
    if (!content) return;
    if (this.isWorking()) return;

    this.input.set('');

    const userMsg: ChatbotMessage = {
      id: createId('msg'),
      role: 'user',
      content,
      createdAt: Date.now()
    };

    this.messages.update((m) => [...m, userMsg]);
    this.suggestions.set([]);

    this.isWorking.set(true);

    try {
      const res = await this.chatbot.ask(this.config, content);
      const assistantMsg: ChatbotMessage = {
        id: createId('msg'),
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        createdAt: Date.now()
      };
      this.messages.update((m) => [...m, assistantMsg]);
      this.suggestions.set(this.rootSuggestions);
    } catch {
      const assistantMsg: ChatbotMessage = {
        id: createId('msg'),
        role: 'assistant',
        content: this.translate.instant('CHATBOT.ERROR.GENERIC'),
        createdAt: Date.now()
      };
      this.messages.update((m) => [...m, assistantMsg]);
      this.suggestions.set(this.rootSuggestions);
    } finally {
      this.isWorking.set(false);
    }
  }

  onSuggestionClick(s: ChatbotSuggestion) {
    if (this.isWorking()) return;

    const prompt = s.promptKey ? this.translate.instant(s.promptKey) : this.translate.instant(s.labelKey);
    if (!prompt) return;

    if (s.followUps?.length) {
      const userMsg: ChatbotMessage = {
        id: createId('msg'),
        role: 'user',
        content: prompt,
        createdAt: Date.now()
      };
      this.messages.update((m) => [...m, userMsg]);

      const assistantText = s.assistantKey
        ? this.translate.instant(s.assistantKey)
        : this.translate.instant('CHATBOT.SUGGESTIONS.DEFAULT_FOLLOWUP');

      const assistantMsg: ChatbotMessage = {
        id: createId('msg'),
        role: 'assistant',
        content: assistantText,
        createdAt: Date.now()
      };
      this.messages.update((m) => [...m, assistantMsg]);
      this.suggestions.set(s.followUps);
      return;
    }

    this.input.set(prompt);
    void this.send();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.send();
    }
  }

  openSource(docUrl: string) {
    try {
      window.open(docUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // ignore
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen()) this.close();
  }
}
