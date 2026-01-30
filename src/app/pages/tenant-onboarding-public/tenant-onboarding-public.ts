import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TenantOnboardingApi, TenantOnboardingInvitationDto } from '../../core/api/tenant-onboarding.api';

@Component({
  selector: 'tenant-onboarding-public',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-orange-50 to-rose-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div class="bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-6 text-white">
            <h1 class="text-2xl font-bold">Compléter votre dossier locataire</h1>
            <p class="text-white/90 text-sm mt-1">Merci de remplir vos informations et de déposer vos documents.</p>
          </div>

          <div class="p-6">
            @if (isLoading()) {
              <div class="flex items-center justify-center py-12">
                <i class="ph ph-spinner text-4xl animate-spin text-slate-400"></i>
              </div>
            } @else if (error()) {
              <div class="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                <p class="text-rose-700 dark:text-rose-300 font-medium">Lien invalide</p>
                <p class="text-sm text-rose-600 dark:text-rose-400 mt-1">{{ error() }}</p>
                <button (click)="goHome()" class="mt-4 px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition">Retour</button>
              </div>
            } @else if (invitation()) {
              <div class="mb-6">
                <p class="text-sm text-slate-600 dark:text-slate-400">Email invité</p>
                <p class="font-semibold text-slate-900 dark:text-white">{{ invitation()!.email }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Expire le {{ invitation()!.expiresAtUtc | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>

              <form (ngSubmit)="submit()" class="space-y-8">
                <div class="grid md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Prénom *</label>
                    <input [(ngModel)]="firstName" name="firstName" required type="text" class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                    @if (fieldErrors().firstName) {
                      <p class="mt-1 text-xs text-rose-600 dark:text-rose-400">{{ fieldErrors().firstName }}</p>
                    }
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nom *</label>
                    <input [(ngModel)]="lastName" name="lastName" required type="text" class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                    @if (fieldErrors().lastName) {
                      <p class="mt-1 text-xs text-rose-600 dark:text-rose-400">{{ fieldErrors().lastName }}</p>
                    }
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Téléphone</label>
                    <input [(ngModel)]="phone" name="phone" type="tel" class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date de naissance</label>
                    <input [(ngModel)]="dateOfBirth" name="dateOfBirth" type="date" class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                  </div>
                </div>

                <div class="grid md:grid-cols-2 gap-4">
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Adresse</label>
                    <input [(ngModel)]="address" name="address" type="text" class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Ville</label>
                    <input [(ngModel)]="city" name="city" type="text" class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Code postal</label>
                    <input [(ngModel)]="postalCode" name="postalCode" type="text" class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pays</label>
                    <input [(ngModel)]="country" name="country" type="text" class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nationalité</label>
                    <input [(ngModel)]="nationality" name="nationality" type="text" class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                  </div>
                </div>

                <div class="grid md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Numéro de pièce (optionnel)</label>
                    <input [(ngModel)]="idNumber" name="idNumber" type="text" class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date fin de validité (si pièce d'identité jointe)</label>
                    <input [(ngModel)]="identityExpiryDate" name="identityExpiryDate" type="date" class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                    @if (fieldErrors().identityExpiryDate) {
                      <p class="mt-1 text-xs text-rose-600 dark:text-rose-400">{{ fieldErrors().identityExpiryDate }}</p>
                    }
                  </div>
                </div>

                <div class="grid md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Profession</label>
                    <input [(ngModel)]="occupation" name="occupation" type="text" class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Revenu mensuel (€)</label>
                    <input [(ngModel)]="monthlyIncome" name="monthlyIncome" type="number" min="0" step="0.01" class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                  </div>
                </div>

                <div class="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4">
                  <h3 class="font-semibold text-slate-900 dark:text-white">Documents</h3>

                  <div class="grid md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pièce d'identité (CNI / Passeport)</label>
                      <input type="file" (change)="onFile($event, 'identity')" accept=".pdf,.jpg,.jpeg,.png" class="block w-full text-sm" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Justificatif de domicile</label>
                      <input type="file" (change)="onFile($event, 'address')" accept=".pdf,.jpg,.jpeg,.png" class="block w-full text-sm" />
                    </div>
                  </div>

                  <div class="grid md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Revenus (3 derniers bulletins) - multi</label>
                      <input type="file" multiple (change)="onFile($event, 'income')" accept=".pdf,.jpg,.jpeg,.png" class="block w-full text-sm" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Garantie (Visale, Fastt, ...)</label>
                      <input type="file" (change)="onFile($event, 'guaranty')" accept=".pdf,.jpg,.jpeg,.png" class="block w-full text-sm" />
                    </div>
                  </div>

                  <div class="grid md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pièce d'identité du garant</label>
                      <input type="file" (change)="onFile($event, 'guarantorIdentity')" accept=".pdf,.jpg,.jpeg,.png" class="block w-full text-sm" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Revenus du garant - multi</label>
                      <input type="file" multiple (change)="onFile($event, 'guarantorIncome')" accept=".pdf,.jpg,.jpeg,.png" class="block w-full text-sm" />
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes (optionnel)</label>
                    <textarea [(ngModel)]="notes" name="notes" rows="3" class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700"></textarea>
                  </div>
                </div>

                @if (submitError()) {
                  <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800">
                    <p class="text-sm text-rose-600 dark:text-rose-400">{{ submitError() }}</p>
                  </div>
                }

                <div class="flex items-center justify-end gap-3">
                  <button type="button" (click)="goHome()" class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">Annuler</button>
                  @if (success()) {
                    <button type="button" (click)="goHome()" class="px-6 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition">
                      Fermer
                    </button>
                  } @else {
                    <button type="submit" [disabled]="isSubmitting()" class="px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:shadow-lg transition disabled:opacity-50">
                      @if (isSubmitting()) {
                        <i class="ph ph-spinner animate-spin mr-2"></i>
                      }
                      Envoyer
                    </button>
                  }
                </div>

                @if (success()) {
                  <div class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <p class="font-semibold text-emerald-800 dark:text-emerald-200">Merci !</p>
                    <p class="text-sm text-emerald-700 dark:text-emerald-300 mt-1">Votre dossier a été transmis.</p>
                  </div>
                }
              </form>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class TenantOnboardingPublic {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(TenantOnboardingApi);

  token = signal<string>('');
  invitation = signal<TenantOnboardingInvitationDto | null>(null);
  isLoading = signal(true);
  isSubmitting = signal(false);
  error = signal<string | null>(null);
  submitError = signal<string | null>(null);
  success = signal(false);
  fieldErrors = signal<{ firstName?: string; lastName?: string; identityExpiryDate?: string }>({});

  firstName = '';
  lastName = '';
  phone = '';
  dateOfBirth = '';
  address = '';
  city = '';
  postalCode = '';
  country = '';
  nationality = '';
  idNumber = '';
  occupation = '';
  monthlyIncome: number | null = null;
  notes = '';
  identityExpiryDate = '';

  identityDocument: File | null = null;
  addressProof: File | null = null;
  guarantyProof: File | null = null;
  guarantorIdentity: File | null = null;
  incomeProofs: File[] = [];
  guarantorIncomeProofs: File[] = [];

  async ngOnInit() {
    const t = (this.route.snapshot.queryParamMap.get('token') ?? '').trim();
    if (!t) {
      this.error.set('Token manquant');
      this.isLoading.set(false);
      return;
    }

    this.token.set(t);

    try {
      const invitation = await firstValueFrom(this.api.getInvitation(t));
      this.invitation.set(invitation);
      this.isLoading.set(false);
    } catch (e: any) {
      const message = e?.error?.message || e?.error?.error || e?.message || 'Invitation invalide';
      this.error.set(message);
      this.isLoading.set(false);
    }
  }

  onFile(event: any, kind: 'identity' | 'address' | 'income' | 'guaranty' | 'guarantorIdentity' | 'guarantorIncome') {
    const input = event?.target as HTMLInputElement;
    const files = input?.files;
    if (!files || files.length === 0) return;

    if (kind === 'identity') this.identityDocument = files[0];
    if (kind === 'address') this.addressProof = files[0];
    if (kind === 'guaranty') this.guarantyProof = files[0];
    if (kind === 'guarantorIdentity') this.guarantorIdentity = files[0];
    if (kind === 'income') this.incomeProofs = Array.from(files);
    if (kind === 'guarantorIncome') this.guarantorIncomeProofs = Array.from(files);
  }

  async submit() {
    if (this.isSubmitting() || this.success()) return;

    this.submitError.set(null);
    this.success.set(false);
    this.fieldErrors.set({});

    this.isSubmitting.set(true);

    const token = this.token();
    if (!token) {
      this.isSubmitting.set(false);
      return;
    }

    const errors: { firstName?: string; lastName?: string; identityExpiryDate?: string } = {};
    if (!this.firstName?.trim()) errors.firstName = 'Champ obligatoire';
    if (!this.lastName?.trim()) errors.lastName = 'Champ obligatoire';
    if (this.identityDocument && !this.identityExpiryDate) errors.identityExpiryDate = 'Champ obligatoire';

    if (Object.keys(errors).length > 0) {
      this.fieldErrors.set(errors);
      this.isSubmitting.set(false);
      return;
    }
    try {
      const fd = new FormData();

      fd.append('firstName', this.firstName.trim());
      fd.append('lastName', this.lastName.trim());
      if (this.phone) fd.append('phone', this.phone);
      if (this.dateOfBirth) fd.append('dateOfBirth', this.dateOfBirth);
      if (this.address) fd.append('address', this.address);
      if (this.city) fd.append('city', this.city);
      if (this.postalCode) fd.append('postalCode', this.postalCode);
      if (this.country) fd.append('country', this.country);
      if (this.nationality) fd.append('nationality', this.nationality);
      if (this.idNumber) fd.append('idNumber', this.idNumber);
      if (this.occupation) fd.append('occupation', this.occupation);
      if (this.monthlyIncome != null) fd.append('monthlyIncome', String(this.monthlyIncome));
      if (this.notes) fd.append('notes', this.notes);

      if (this.identityExpiryDate) fd.append('identityExpiryDate', this.identityExpiryDate);

      if (this.identityDocument) fd.append('identityDocument', this.identityDocument);
      if (this.addressProof) fd.append('addressProof', this.addressProof);
      if (this.guarantyProof) fd.append('guarantyProof', this.guarantyProof);
      if (this.guarantorIdentity) fd.append('guarantorIdentity', this.guarantorIdentity);

      for (const f of this.incomeProofs) fd.append('incomeProofs', f);
      for (const f of this.guarantorIncomeProofs) fd.append('guarantorIncomeProofs', f);

      await firstValueFrom(this.api.submit(token, fd));
      this.success.set(true);
    } catch (e: any) {
      const message = e?.error?.message || e?.error?.error || e?.message || 'Erreur lors de la soumission';
      this.submitError.set(message);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
