// core/ui/toast.service.ts
import { inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface ToastMessage { id: number; type: ToastType; message: string; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _items = signal<ToastMessage[]>([]);
  readonly items = this._items.asReadonly();

   private counter = 0;
  private readonly i18n = inject(TranslateService);

 private push(type: ToastMessage['type'], message: string) {
    const toast: ToastMessage = { id: ++this.counter, type, message  };
    this._items.update(list => [...list, toast]);
    setTimeout(() => this.dismiss(toast.id), 4000);
  }
  
  // ✅ Affichage avec clé i18n
  show(key: string, type: ToastMessage['type'] = 'info') {
    const text = this.i18n.instant(key) || key;
    this.push(type, text);
  }
  success(key: string) { this.show(key, 'success'); }
  error(key: string) { this.show(key, 'error'); }
  info(key: string) { this.show(key, 'info'); }
  warning(key: string) { this.show(key, 'warning'); }
  
  // ✅ Affichage direct sans i18n (pour messages dynamiques)
  showDirect(message: string, type: ToastMessage['type'] = 'info') {
    this.push(type, message);
  }
  successDirect(message: string) { this.showDirect(message, 'success'); }
  errorDirect(message: string) { this.showDirect(message, 'error'); }
  infoDirect(message: string) { this.showDirect(message, 'info'); }
  warningDirect(message: string) { this.showDirect(message, 'warning'); }

  dismiss(id: number) {
    this._items.update(list => list.filter(t => t.id !== id));
  }
}
