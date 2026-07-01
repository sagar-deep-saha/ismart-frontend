import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/admin/auth.service';
import { ToastService } from '../../../services/toast.service';

type LoginFlowState = 'login' | 'forgot_password_email' | 'forgot_password_reset';

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

  flowState = signal<LoginFlowState>('login');
  
  loginForm: FormGroup;
  forgotEmailForm: FormGroup;
  resetPasswordForm: FormGroup;

  isSubmitting = signal(false);
  showPassword = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.forgotEmailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetPasswordForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  setFlow(state: LoginFlowState) {
    this.flowState.set(state);
    this.isSubmitting.set(false);
    if (state === 'login') {
      this.loginForm.reset();
    } else if (state === 'forgot_password_email') {
      this.forgotEmailForm.reset();
    } else if (state === 'forgot_password_reset') {
      this.resetPasswordForm.reset();
    }
  }

  onSubmitLogin() {
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
        const errMsg = err.error?.message || err.error?.error || 'Invalid credentials.';
        this.toastService.show(errMsg, 'error');
      }
    });
  }

  onSubmitForgotEmail() {
    if (this.forgotEmailForm.invalid) {
      this.forgotEmailForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const email = this.forgotEmailForm.value.email;

    this.authService.forgotPasswordSendOtp(email).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toastService.show(res.message, 'success');
        this.setFlow('forgot_password_reset');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.show(err.error?.message || 'Failed to send OTP.', 'error');
      }
    });
  }

  onSubmitResetPassword() {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }
    
    if (this.resetPasswordForm.value.password !== this.resetPasswordForm.value.password_confirmation) {
      this.toastService.show('Passwords do not match.', 'error');
      return;
    }

    this.isSubmitting.set(true);
    const email = this.forgotEmailForm.value.email; // Carry over email
    const { otp, password, password_confirmation } = this.resetPasswordForm.value;

    this.authService.forgotPasswordReset(email, otp, password, password_confirmation).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toastService.show(res.message, 'success');
        this.setFlow('login');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.toastService.show(err.error?.message || 'Failed to reset password.', 'error');
      }
    });
  }
}
