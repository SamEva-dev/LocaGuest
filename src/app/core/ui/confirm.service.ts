import { Injectable, signal } from '@angular/core';
import { ConfirmType } from '../../shared/components/confirm-modal/confirm-modal';

export interface ConfirmOptions {
  title: string;
  message: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  id: number;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private counter = 0;
  private currentConfirm = signal<ConfirmState | null>(null);
  
  readonly confirm = this.currentConfirm.asReadonly();
  
  /**
   * Affiche un modal de confirmation et retourne une Promise<boolean>
   * @param options Options du modal
   * @returns Promise qui résout à true si confirmé, false si annulé
   */
  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmState: ConfirmState = {
        id: ++this.counter,
        title: options.title,
        message: options.message,
        type: options.type || 'warning',
        confirmText: options.confirmText || 'Confirmer',
        cancelText: options.cancelText || 'Annuler',
        showCancel: options.showCancel !== false,
        resolve
      };
      
      this.currentConfirm.set(confirmState);
    });
  }
  
  /**
   * Confirme l'action
   */
  handleConfirm() {
    const current = this.currentConfirm();
    if (current) {
      current.resolve(true);
      this.currentConfirm.set(null);
    }
  }
  
  /**
   * Annule l'action
   */
  handleCancel() {
    const current = this.currentConfirm();
    if (current) {
      current.resolve(false);
      this.currentConfirm.set(null);
    }
  }
  
  /**
   * Helpers pour types courants
   */
  danger(title: string, message: string, confirmText = 'Supprimer'): Promise<boolean> {
    return this.ask({ title, message, type: 'danger', confirmText });
  }
  
  warning(title: string, message: string): Promise<boolean> {
    return this.ask({ title, message, type: 'warning' });
  }
  
  info(title: string, message: string): Promise<boolean> {
    return this.ask({ title, message, type: 'info' });
  }
  
  success(title: string, message: string): Promise<boolean> {
    return this.ask({ title, message, type: 'success' });
  }
}
