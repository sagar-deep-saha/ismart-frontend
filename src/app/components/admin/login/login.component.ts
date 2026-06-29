import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/admin/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  loginForm: FormGroup;
  isSubmitting = signal(false);
  showPassword = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.show('Logged in successfully', 'success');
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error(err);
        const errMsg = err.error?.message || err.error?.error || 'Invalid credentials.';
        this.toastService.show(errMsg, 'error');
      }
    });
  }
}
