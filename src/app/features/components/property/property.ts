import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'property',
  imports: [FormsModule, CommonModule, TranslatePipe],
  templateUrl: './property.html',
  styleUrl: './property.scss'
})
export class Property {

  private translate = inject(TranslateService)
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  
  property = {
    name: '',
    address: '',
    type: 'apartment',
    status: 'available',
    rent: null
  };
}
