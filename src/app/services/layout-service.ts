import { Injectable, signal } from '@angular/core';

export type LayoutMode = 'header' | 'sidebar';

const STORAGE_KEY = 'layoutMode';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private readonly _mode = signal<LayoutMode>(this.readInitial());

  mode = this._mode.asReadonly();

  setMode(mode: LayoutMode) {
    this._mode.set(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }

  toggle() {
    this.setMode(this._mode() === 'sidebar' ? 'header' : 'sidebar');
  }

  private readInitial(): LayoutMode {
    const saved = localStorage.getItem(STORAGE_KEY) as LayoutMode | null;
    return saved === 'header' || saved === 'sidebar' ? saved : 'sidebar';
  }
}
