import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CHATBOT_CONFIG } from './chatbot.tokens';
import { ChatbotMessage } from './chatbot.types';
import { ChatbotService } from './chatbot.service';
import { createId } from './chatbot.util';

@Component({
  selector: 'chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot-widget.html',
  styleUrl: './chatbot-widget.scss'
})
export class ChatbotWidget {
  private config = inject(CHATBOT_CONFIG);
  private chatbot = inject(ChatbotService);

  isOpen = signal(false);
  isWorking = signal(false);
  input = signal('');

  messages = signal<ChatbotMessage[]>([]);

  ngOnInit() {
    const greeting: ChatbotMessage = {
      id: createId('msg'),
      role: 'assistant',
      content: `Bonjour, je suis l'assistant ${this.config.appName}. Pose-moi ta question, je chercherai dans la documentation et je te guiderai.`,
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
    } catch {
      const assistantMsg: ChatbotMessage = {
        id: createId('msg'),
        role: 'assistant',
        content: `Je n'ai pas réussi à générer une réponse pour le moment. Vérifie la configuration de l'IA (endpoint) ou réessaye.`,
        createdAt: Date.now()
      };
      this.messages.update((m) => [...m, assistantMsg]);
    } finally {
      this.isWorking.set(false);
    }
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
