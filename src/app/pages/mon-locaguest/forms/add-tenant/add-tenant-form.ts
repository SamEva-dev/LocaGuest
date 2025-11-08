import { Component, output, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { TenantsApi } from '../../../../core/api/tenants.api';

@Component({
  selector: 'add-tenant-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './add-tenant-form.html'
})
export class AddTenantForm {
  private fb = inject(FormBuilder);
  private tenantsApi = inject(TenantsApi);

  // Outputs
  tenantCreated = output<any>();
  closeForm = output<void>();

  // State
  isSubmitting = signal(false);
  maxBirthDate = new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0];

  // Form
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      // Informations personnelles
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
      phone: ['', Validators.maxLength(50)],
      dateOfBirth: [null],
      nationality: ['', Validators.maxLength(100)],
      idNumber: ['', Validators.maxLength(50)],
      
      // Adresse
      address: ['', Validators.maxLength(300)],
      city: ['', Validators.maxLength(100)],
      postalCode: ['', Validators.maxLength(20)],
      country: ['', Validators.maxLength(100)],
      
      // Contact d'urgence
      emergencyContact: ['', Validators.maxLength(200)],
      emergencyPhone: ['', Validators.maxLength(50)],
      
      // Professionnel
      occupation: ['', Validators.maxLength(200)],
      monthlyIncome: [null, Validators.min(0)],
      notes: ['', Validators.maxLength(1000)]
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.form.value;
    const createTenantDto = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phone: formValue.phone,
      dateOfBirth: formValue.dateOfBirth,
      address: formValue.address,
      city: formValue.city,
      postalCode: formValue.postalCode,
      country: formValue.country,
      nationality: formValue.nationality,
      idNumber: formValue.idNumber,
      emergencyContact: formValue.emergencyContact,
      emergencyPhone: formValue.emergencyPhone,
      occupation: formValue.occupation,
      monthlyIncome: formValue.monthlyIncome,
      notes: formValue.notes
    };

    this.tenantsApi.createTenant(createTenantDto).subscribe({
      next: (tenant: any) => {
        console.log('✅ Tenant created successfully:', tenant);
        this.isSubmitting.set(false);
        this.tenantCreated.emit(tenant);
        this.close();
      },
      error: (error: any) => {
        console.error('❌ Error creating tenant:', error);
        this.isSubmitting.set(false);
        // TODO: Show error notification
        alert('Erreur lors de la création du locataire: ' + (error.error?.message || error.message));
      }
    });
  }

  close() {
    this.closeForm.emit();
  }
}
