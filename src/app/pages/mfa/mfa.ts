import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/services/auth.service';

@Component({
  selector: 'app-mfa',
  imports: [ CommonModule, ReactiveFormsModule],
  templateUrl: './mfa.html',
  styleUrls: ['./mfa.scss']
})
export class MfaComponent  {
  
  loading = signal(false);
  error = signal<string | null>(null);
  codeForm!: FormGroup;

  constructor(private fb: FormBuilder, private auth: AuthService) {
    this.codeForm = this.fb.group({ code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]] });
  }

  get pendingUser() {
    return this.auth.mfaPendingUser();
  }

  async verify() {
    if (this.codeForm.invalid || !this.pendingUser) return;
    this.loading.set(true);
    this.error.set(null);

    await this.auth.verifyMfa({ userId: this.pendingUser.id, code: this.codeForm.value.code! });
  }

  cancel() {
    this.auth.logout();
  }
}
