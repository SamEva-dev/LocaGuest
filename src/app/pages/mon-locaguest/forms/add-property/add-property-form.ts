import { Component, output, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PropertiesApi } from '../../../../core/api/properties.api';

@Component({
  selector: 'add-property-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './add-property-form.html'
})
export class AddPropertyForm {
  private fb = inject(FormBuilder);
  private propertiesApi = inject(PropertiesApi);

  // Outputs
  propertyCreated = output<any>();
  closeForm = output<void>();

  // State
  isSubmitting = signal(false);
  currentYear = new Date().getFullYear();

  // Form
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      // Informations générales
      name: ['', [Validators.required, Validators.maxLength(200)]],
      type: ['', Validators.required],
      
      // Adresse
      address: ['', [Validators.required, Validators.maxLength(300)]],
      city: ['', Validators.maxLength(100)],
      postalCode: ['', Validators.maxLength(20)],
      country: ['', Validators.maxLength(100)],
      
      // Caractéristiques
      surface: [0, [Validators.required, Validators.min(0)]],
      bedrooms: [0, Validators.min(0)],
      bathrooms: [0, Validators.min(0)],
      floor: [null],
      hasElevator: [false],
      hasParking: [false],
      hasBalcony: [false],
      
      // Financier
      rent: [0, [Validators.required, Validators.min(0)]],
      charges: [0, Validators.min(0)],
      purchasePrice: [null, Validators.min(0)],
      purchaseDate: [null],
      
      // Informations complémentaires
      energyClass: [''],
      constructionYear: [null, [Validators.min(1800), Validators.max(this.currentYear)]],
      description: ['', Validators.maxLength(1000)]
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.form.value;
    const createPropertyDto = {
      name: formValue.name,
      address: formValue.address,
      city: formValue.city,
      postalCode: formValue.postalCode,
      country: formValue.country,
      type: formValue.type,
      surface: formValue.surface,
      bedrooms: formValue.bedrooms,
      bathrooms: formValue.bathrooms,
      floor: formValue.floor,
      hasElevator: formValue.hasElevator,
      hasParking: formValue.hasParking,
      hasBalcony: formValue.hasBalcony,
      rent: formValue.rent,
      charges: formValue.charges,
      description: formValue.description,
      purchaseDate: formValue.purchaseDate,
      purchasePrice: formValue.purchasePrice,
      energyClass: formValue.energyClass,
      constructionYear: formValue.constructionYear
    };

    this.propertiesApi.createProperty(createPropertyDto).subscribe({
      next: (property: any) => {
        console.log('✅ Property created successfully:', property);
        this.isSubmitting.set(false);
        this.propertyCreated.emit(property);
        this.close();
      },
      error: (error: any) => {
        console.error('❌ Error creating property:', error);
        this.isSubmitting.set(false);
        // TODO: Show error notification
        alert('Erreur lors de la création du bien: ' + (error.error?.message || error.message));
      }
    });
  }

  close() {
    this.closeForm.emit();
  }
}
