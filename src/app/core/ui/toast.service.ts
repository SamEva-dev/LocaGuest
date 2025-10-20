// core/ui/toast.service.ts
import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface Toast { id: number; type: ToastType; message: string; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _items = signal<Toast[]>([]);
  readonly items = this._items.asReadonly();

  show(type: ToastType, message: string) {
    const id = Date.now() + Math.random();
    this._items.update(list => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), 4000);
  }

  success(msg: string) { this.show('success', msg); }
  error(msg: string) { this.show('error', msg); }
  info(msg: string) { this.show('info', msg); }
  warn(msg: string) { this.show('warning', msg); }

  dismiss(id: number) {
    this._items.update(list => list.filter(t => t.id !== id));
  }
}
