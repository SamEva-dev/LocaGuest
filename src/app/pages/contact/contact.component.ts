import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ContactApi } from '../../core/api/contact.api';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './contact.component.html'
})
export class ContactComponent {
  private contactApi = inject(ContactApi);

  formData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  isSubmitting = signal(false);
  isSubmitted = signal(false);
  error = signal<string | null>(null);
  messageId = signal<string | null>(null);

  subjects = [
    { key: 'GENERAL', value: 'general' },
    { key: 'SUPPORT', value: 'support' },
    { key: 'SALES', value: 'sales' },
    { key: 'PARTNERSHIP', value: 'partnership' }
  ];

  submitForm() {
    if (!this.formData.name || !this.formData.email || !this.formData.message) {
      this.error.set('CONTACT_PAGE.ERROR.REQUIRED_FIELDS');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    this.contactApi.sendMessage({
      name: this.formData.name,
      email: this.formData.email,
      subject: this.formData.subject || undefined,
      message: this.formData.message
    }).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.isSubmitted.set(true);
        this.messageId.set(response.messageId);
        this.formData = { name: '', email: '', subject: '', message: '' };
      },
      error: () => {
        this.isSubmitting.set(false);
        this.error.set('CONTACT_PAGE.ERROR.SEND_FAILED');
      }
    });
  }
}
