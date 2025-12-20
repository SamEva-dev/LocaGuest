import { Component, output, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PropertiesService } from '../../../../core/services/properties.service';
import { CreatePropertyDto, PropertyDetail } from '../../../../core/api/properties.api';

@Component({
  selector: 'add-property-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './add-property-form.html'
})
export class AddPropertyForm {
  private fb = inject(FormBuilder);
  private propertiesService = inject(PropertiesService);

  // Outputs
  propertyCreated = output<PropertyDetail>();
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
      propertyUsageType: ['complete', Validators.required],  // complete, colocation, airbnb
      
      // Adresse
      address: ['', [Validators.required, Validators.maxLength(300)]],
      city: ['', Validators.maxLength(100)],
      postalCode: ['', Validators.maxLength(20)],
      country: ['', Validators.maxLength(100)],
      
      // Caractéristiques
      surface: [0, [Validators.required, Validators.min(0)]],
      bedrooms: [0, [Validators.required, Validators.min(1)]],
      bathrooms: [0, [Validators.required, Validators.min(1)]],
      floor: [null],
      hasElevator: [false],
      hasParking: [false],
      hasBalcony: [false],
      
      // Financier
      rent: [0, [Validators.required, Validators.min(0)]],
      charges: [0, Validators.min(0)],
      purchasePrice: [null, Validators.min(0)],
      purchaseDate: [null],
      insurance: [null, Validators.min(0)],
      managementFeesRate: [null, [Validators.min(0), Validators.max(100)]],
      maintenanceRate: [null, [Validators.min(0), Validators.max(100)]],
      vacancyRate: [null, [Validators.min(0), Validators.max(100)]],
      propertyTax: [null, Validators.min(0)],
      condominiumCharges: [null, Validators.min(0)],
      
      // Informations complémentaires
      energyClass: [''],
      constructionYear: [null, [Validators.min(1800), Validators.max(this.currentYear)]],
      description: ['', Validators.maxLength(1000)],
      
      // Pour colocation (validation conditionnelle)
      totalRooms: [null],
      rooms: this.fb.array([]),  // ✅ NOUVEAU: FormArray pour les chambres
      
      // Pour Airbnb (validation conditionnelle)
      minimumStay: [null],
      maximumStay: [null, Validators.min(1)],
      pricePerNight: [null],
      nightsBookedPerMonth: [null, [Validators.min(0), Validators.max(31)]]
    });
    
    // ✅ Gestion des validations conditionnelles selon le type d'utilisation
    this.form.get('propertyUsageType')?.valueChanges.subscribe(usageType => {
      this.updateConditionalValidators(usageType);
      this.updateFinancialBehavior(usageType);
    });

    // Keep financial values in sync with sub-forms
    this.rooms.valueChanges.subscribe(() => {
      if (this.form.get('propertyUsageType')?.value === 'colocation') {
        this.recomputeColocationTotals();
      }
    });

    this.form.get('minimumStay')?.valueChanges.subscribe(() => {
      if (this.form.get('propertyUsageType')?.value === 'airbnb') {
        this.recomputeAirbnbRent();
      }
    });

    this.form.get('pricePerNight')?.valueChanges.subscribe(() => {
      if (this.form.get('propertyUsageType')?.value === 'airbnb') {
        this.recomputeAirbnbRent();
      }
    });
    
    // ✅ NOUVEAU: Gestion dynamique des chambres quand totalRooms change
    this.form.get('totalRooms')?.valueChanges.subscribe(totalRooms => {
      this.onTotalRoomsChange(totalRooms);
    });

    // Apply initial behavior
    this.updateFinancialBehavior(this.form.get('propertyUsageType')?.value);
  }
  
  // ✅ NOUVEAU: Getter pour accéder au FormArray des chambres
  get rooms(): FormArray {
    console.log('rooms',this.form.get('rooms'));
    return this.form.get('rooms') as FormArray;
  }
  
  // ✅ NOUVEAU: Créer un FormGroup pour une chambre
  private createRoomFormGroup(index: number): FormGroup {
    return this.fb.group({
      name: [`Chambre ${index + 1}`, [Validators.required, Validators.maxLength(100)]],
      surface: [null, Validators.min(0)],
      rent: [0, [Validators.required, Validators.min(0)]],
      charges: [0, Validators.min(0)],
      description: ['', Validators.maxLength(500)]
    });
  }
  
  // ✅ NOUVEAU: Ajouter une chambre au FormArray
  addRoom() {
    const currentCount = this.rooms.length;
    this.rooms.push(this.createRoomFormGroup(currentCount));
  }
  
  // ✅ NOUVEAU: Supprimer une chambre du FormArray
  removeRoom(index: number) {
    this.rooms.removeAt(index);
    // Renommer les chambres restantes
    this.rooms.controls.forEach((control, i) => {
      const currentName = control.get('name')?.value;
      if (currentName.startsWith('Chambre ')) {
        control.get('name')?.setValue(`Chambre ${i + 1}`);
      }
    });
  }
  
  // ✅ NOUVEAU: Gérer le changement du nombre total de chambres
  private onTotalRoomsChange(totalRooms: number | null) {
    if (!totalRooms || totalRooms <= 0) {
      // Vider le FormArray si totalRooms est invalide
      this.rooms.clear();
      return;
    }
    
    const currentCount = this.rooms.length;
    
    if (totalRooms > currentCount) {
      // Ajouter des chambres
      for (let i = currentCount; i < totalRooms; i++) {
        this.addRoom();
      }
    } else if (totalRooms < currentCount) {
      // Supprimer des chambres
      for (let i = currentCount - 1; i >= totalRooms; i--) {
        this.rooms.removeAt(i);
      }
    }
  }
  
  private updateConditionalValidators(usageType: string) {
    const totalRooms = this.form.get('totalRooms');
    const bedrooms = this.form.get('bedrooms');
    const minimumStay = this.form.get('minimumStay');
    const pricePerNight = this.form.get('pricePerNight');
    
    // Reset all conditional validators
    totalRooms?.clearValidators();
    bedrooms?.clearValidators();
    minimumStay?.clearValidators();
    pricePerNight?.clearValidators();
    
    if (usageType === 'colocation') {
      // Pour colocation: totalRooms required, bedrooms non-required
      totalRooms?.setValidators([Validators.required, Validators.min(1)]);
      bedrooms?.setValidators([Validators.min(0)]);
    } else if (usageType === 'airbnb') {
      // Pour Airbnb: minimumStay et pricePerNight required
      minimumStay?.setValidators([Validators.required, Validators.min(1)]);
      pricePerNight?.setValidators([Validators.required, Validators.min(0)]);
      bedrooms?.setValidators([Validators.required, Validators.min(1)]);
    } else {
      // Pour location complète: bedrooms required
      bedrooms?.setValidators([Validators.required, Validators.min(1)]);
    }
    
    // Update validity
    totalRooms?.updateValueAndValidity();
    bedrooms?.updateValueAndValidity();
    minimumStay?.updateValueAndValidity();
    pricePerNight?.updateValueAndValidity();
  }

  private updateFinancialBehavior(usageType: string) {
    const rent = this.form.get('rent');
    const charges = this.form.get('charges');

    if (!rent || !charges) return;

    if (usageType === 'complete') {
      rent.enable({ emitEvent: false });
      charges.enable({ emitEvent: false });
      return;
    }

    if (usageType === 'colocation') {
      rent.disable({ emitEvent: false });
      charges.disable({ emitEvent: false });
      this.recomputeColocationTotals();
      return;
    }

    if (usageType === 'airbnb') {
      rent.disable({ emitEvent: false });
      charges.disable({ emitEvent: false });
      charges.setValue(0, { emitEvent: false });
      this.recomputeAirbnbRent();
      return;
    }
  }

  private recomputeColocationTotals() {
    const rentCtrl = this.form.get('rent');
    const chargesCtrl = this.form.get('charges');
    if (!rentCtrl || !chargesCtrl) return;

    const toNumber = (v: any) => {
      const n = typeof v === 'number' ? v : Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const roomsRaw = this.rooms.getRawValue() as Array<{ rent?: any; charges?: any }>;
    const totalRent = roomsRaw.reduce((sum, r) => sum + toNumber(r?.rent), 0);
    const totalCharges = roomsRaw.reduce((sum, r) => sum + toNumber(r?.charges), 0);

    rentCtrl.setValue(totalRent, { emitEvent: false });
    chargesCtrl.setValue(totalCharges, { emitEvent: false });
  }

  private recomputeAirbnbRent() {
    const rentCtrl = this.form.get('rent');
    if (!rentCtrl) return;

    const nights = Number(this.form.get('minimumStay')?.value ?? 0);
    const price = Number(this.form.get('pricePerNight')?.value ?? 0);
    const safeNights = Number.isFinite(nights) ? nights : 0;
    const safePrice = Number.isFinite(price) ? price : 0;

    rentCtrl.setValue(safeNights * safePrice, { emitEvent: false });
  }

  onSubmit() {
    console.log('📝 Form submission attempt');
    console.log('Form value:', this.form.value);
    console.log('Form valid:', this.form.valid);
    console.log('Form errors:', this.getFormValidationErrors());
    
    if (this.form.invalid) {
      console.error('❌ Form is invalid, marking all as touched');
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.form.getRawValue();
    const createPropertyDto: CreatePropertyDto = {
      name: formValue.name,
      address: formValue.address,
      city: formValue.city,
      postalCode: formValue.postalCode,
      country: formValue.country,
      type: formValue.type,
      propertyUsageType: formValue.propertyUsageType,
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

      insurance: formValue.insurance,
      managementFeesRate: formValue.managementFeesRate,
      maintenanceRate: formValue.maintenanceRate,
      vacancyRate: formValue.vacancyRate,
      propertyTax: formValue.propertyTax,
      condominiumCharges: formValue.condominiumCharges,
      energyClass: formValue.energyClass,
      constructionYear: formValue.constructionYear,
      totalRooms: formValue.totalRooms,
      rooms: formValue.propertyUsageType === 'colocation' ? formValue.rooms : undefined,  // ✅ NOUVEAU: Inclure les chambres si colocation
      minimumStay: formValue.minimumStay,
      maximumStay: formValue.maximumStay,
      pricePerNight: formValue.pricePerNight,
      nightsBookedPerMonth: formValue.nightsBookedPerMonth
    };
    
    console.log('📦 Creating property with DTO:', createPropertyDto);

    this.propertiesService.createProperty(createPropertyDto).subscribe({
      next: (property: PropertyDetail) => {
        console.log('✅ Property created successfully:', property);
        this.isSubmitting.set(false);
        this.propertyCreated.emit(property);
        this.close();
      },
      error: (error: unknown) => {
        console.error('❌ Error creating property:', error);
        this.isSubmitting.set(false);
        // TODO: Show error notification
        const errMsg = (error as any)?.error?.message || (error as any)?.message || 'Erreur inconnue';
        alert('Erreur lors de la création du bien: ' + errMsg);
      }
    });
  }

  close() {
    this.closeForm.emit();
  }
  
  // Helper pour debug validation errors
  private getFormValidationErrors() {
    const errors: any = {};
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }
}
