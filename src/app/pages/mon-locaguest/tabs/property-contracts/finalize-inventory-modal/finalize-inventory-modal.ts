import { Component, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { InventoryEntryDto } from '../../../../../core/api/inventories.api';
import { Contract } from '../../../../../core/api/properties.api';

@Component({
  selector: 'finalize-inventory-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './finalize-inventory-modal.html'
})
export class FinalizeInventoryModal {
  inventory = input.required<InventoryEntryDto>();
  contract = input.required<Contract>();
  tenantName = input.required<string>();
  propertyName = input.required<string>();
  
  onClose = output<void>();
  onConfirm = output<'paper' | 'electronic'>();
  
  step = signal<'method' | 'confirm'>('method');
  signatureMethod = signal<'paper' | 'electronic' | null>(null);
  isSubmitting = signal(false);
  
  close() {
    if (!this.isSubmitting()) {
      this.onClose.emit();
    }
  }
  
  selectMethod(method: 'paper' | 'electronic') {
    this.signatureMethod.set(method);
    this.step.set('confirm');
  }
  
  goBack() {
    this.step.set('method');
  }
  
  confirmFinalization() {
    if (this.signatureMethod() && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      this.onConfirm.emit(this.signatureMethod()!);
    }
  }
}
