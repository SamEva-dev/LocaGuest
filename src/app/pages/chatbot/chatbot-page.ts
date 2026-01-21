import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { CHATBOT_CONFIG } from '../../shared/chatbot/chatbot.tokens';
import { DocIndexService } from '../../shared/chatbot/doc-index.service';

@Component({
  selector: 'chatbot-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './chatbot-page.html',
  styleUrl: './chatbot-page.scss'
})
export class ChatbotPage {
  private config = inject(CHATBOT_CONFIG);
  private docIndex = inject(DocIndexService);
  private translate = inject(TranslateService);

  status = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  error = signal<string>('');

  query = signal('');
  results = signal<any[]>([]);

  async init() {
    this.status.set('loading');
    this.error.set('');

    try {
      await this.docIndex.ensureIndexed(this.config.docs, this.config.indexUrl);
      this.status.set('ready');
    } catch {
      this.status.set('error');
      this.error.set(this.translate.instant('CHATBOT.DEBUG.INDEX_LOAD_ERROR'));
    }
  }

  async search() {
    const q = this.query().trim();
    if (!q) return;

    if (this.status() !== 'ready') {
      await this.init();
      if (this.status() !== 'ready') return;
    }

    const sources = this.docIndex.search(q, this.config.maxSources);
    this.results.set(sources);
  }

  ngOnInit() {
    void this.init();
  }
}
