import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { PropertyService } from '../../services/property.service';
import { PropertyDto } from '../../models/models';

@Component({
  selector: 'property',
  imports: [FormsModule, CommonModule, TranslatePipe],
  templateUrl: './property.html',
  styleUrl: './property.scss'
})
export class Property {

  private translate = inject(TranslateService)
  private readonly propertyService = inject(PropertyService);

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<PropertyDto>();

  
  property: PropertyDto = {
    id: '',
    name: '',
    address: '',
    type: 'apartment',
    status: 'vacant',
    rent: 0,
  };

   /** Sauvegarde côté backend */
  async saveProperty() {
    try {
      const created = await this.propertyService.create(this.property);
      this.save.emit(created);
      this.close.emit();
    } catch (err: any) {
      console.error('Erreur création propriété :', err);
      alert(this.translate.instant('COMMON.ERROR'));
    }
  }
}
