import { Component, input, output, signal } from '@angular/core';

export type ConfirmType = 'info' | 'warning' | 'danger' | 'success';

@Component({
  selector: 'confirm-modal',
  standalone: true,
  imports: [],
  templateUrl: './confirm-modal.html'
})
export class ConfirmModal {
  // Inputs
  title = input.required<string>();
  message = input.required<string>();
  type = input<ConfirmType>('warning');
  confirmText = input<string>('Confirmer');
  cancelText = input<string>('Annuler');
  showCancel = input<boolean>(true);
  
  // Outputs
  onConfirm = output<void>();
  onCancel = output<void>();
  
  // State
  isProcessing = signal(false);
  
  confirm() {
    if (!this.isProcessing()) {
      this.isProcessing.set(true);
      this.onConfirm.emit();
    }
  }
  
  cancel() {
    if (!this.isProcessing()) {
      this.onCancel.emit();
    }
  }
  
  getTypeConfig() {
    const configs = {
      info: {
        gradient: 'from-blue-600 to-indigo-600',
        icon: 'ph-info',
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600',
        buttonBg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
        buttonHover: 'hover:from-blue-700 hover:to-indigo-700'
      },
      warning: {
        gradient: 'from-amber-600 to-orange-600',
        icon: 'ph-warning',
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconColor: 'text-amber-600',
        buttonBg: 'bg-gradient-to-r from-amber-600 to-orange-600',
        buttonHover: 'hover:from-amber-700 hover:to-orange-700'
      },
      danger: {
        gradient: 'from-red-600 to-rose-600',
        icon: 'ph-warning-circle',
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600',
        buttonBg: 'bg-gradient-to-r from-red-600 to-rose-600',
        buttonHover: 'hover:from-red-700 hover:to-rose-700'
      },
      success: {
        gradient: 'from-emerald-600 to-teal-600',
        icon: 'ph-check-circle',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        iconColor: 'text-emerald-600',
        buttonBg: 'bg-gradient-to-r from-emerald-600 to-teal-600',
        buttonHover: 'hover:from-emerald-700 hover:to-teal-700'
      }
    };
    return configs[this.type()];
  }
}
