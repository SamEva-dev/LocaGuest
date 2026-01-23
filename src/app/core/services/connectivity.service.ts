import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly online$ = new BehaviorSubject<boolean>(navigator.onLine);

  constructor() {
    window.addEventListener('online', () => this.online$.next(true));
    window.addEventListener('offline', () => this.online$.next(false));
  }

  isOnline(): boolean {
    return this.online$.value;
  }

  onlineChanges(): Observable<boolean> {
    return this.online$.asObservable();
  }
}
