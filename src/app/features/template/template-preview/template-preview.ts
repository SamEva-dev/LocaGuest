import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, effect, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'template-preview',
  standalone: true,
  imports: [TranslateModule,CommonModule],
  templateUrl: './template-preview.html'
})
export class TemplatePreview {
  private readonly sanitizer = inject(DomSanitizer);

  @Input() html: string | null = null;
  @Output() close = new EventEmitter<void>();

  safeHtml = signal<SafeHtml | null>(null);

  constructor() {
    effect(() => {
      this.safeHtml.set(this.html ? this.sanitizer.bypassSecurityTrustHtml(this.html) : null);
    });
  }
}
