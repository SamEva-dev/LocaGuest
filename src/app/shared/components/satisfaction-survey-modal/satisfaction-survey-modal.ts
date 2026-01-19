import { CommonModule } from '@angular/common';
import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ToastService } from '../../../core/ui/toast.service';
import { SatisfactionSurveyApi } from '../../../core/api/satisfaction-survey.api';

@Component({
  selector: 'satisfaction-survey-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './satisfaction-survey-modal.html'
})
export class SatisfactionSurveyModal {
  private surveyApi = inject(SatisfactionSurveyApi);
  private toast = inject(ToastService);

  onClose = output<void>();
  onSubmitted = output<void>();

  rating = signal<number>(0);
  comment = signal<string>('');
  isSubmitting = signal(false);

  close() {
    if (this.isSubmitting()) return;
    this.onClose.emit();
  }

  submit() {
    if (this.rating() < 1 || this.rating() > 5) {
      this.toast.error('SURVEY.ERROR.RATING_REQUIRED');
      return;
    }

    this.isSubmitting.set(true);

    this.surveyApi.submit({
      rating: this.rating(),
      comment: this.comment().trim() || undefined
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success('SURVEY.SUCCESS');
        this.onSubmitted.emit();
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toast.error('SURVEY.ERROR.SEND_FAILED');
      }
    });
  }
}
