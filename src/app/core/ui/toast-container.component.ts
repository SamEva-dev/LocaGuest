// core/ui/toast-container.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <div *ngFor="let t of toast.items()"
           class="px-4 py-3 rounded-lg shadow text-white cursor-pointer transition"
           [ngClass]="{
             'bg-green-600': t.type === 'success',
             'bg-red-600': t.type === 'error',
             'bg-blue-600': t.type === 'info',
             'bg-amber-500': t.type === 'warning'
           }"
           (click)="toast.dismiss(t.id)">
        {{ t.message | translate }}
      </div>
    </div>
  `
  ,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
  `]
})
export class ToastContainerComponent {
  toast = inject(ToastService);
  private translate = inject(TranslateService);
}
