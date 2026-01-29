import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type PaymentsRefreshReason = 'payment_created' | 'deposit_recorded' | 'contract_signed' | 'unknown';

@Injectable({ providedIn: 'root' })
export class PaymentsRefreshService {
  private readonly _refresh$ = new Subject<PaymentsRefreshReason>();

  readonly refresh$ = this._refresh$.asObservable();

  trigger(reason: PaymentsRefreshReason = 'unknown') {
    this._refresh$.next(reason);
  }
}
