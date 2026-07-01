import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SettingsService, SettingsData } from '../../../services/admin/settings.service';
import { ToastService } from '../../../services/toast.service';
import { API_URL } from '../../../services/admin/config';

type SettingsTab = 'security' | 'smtp' | 'notifications';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  fb = inject(FormBuilder);
  settingsService = inject(SettingsService);
  toastService = inject(ToastService);

  activeTab = signal<SettingsTab>('security');
  isLoading = signal(true);
  isSavingSmtp = signal(false);
  isTestingSmtp = signal(false);

  // Email Change
  emailForm: FormGroup;
  emailChangeState = signal<'request' | 'verify'>('request');
  isEmailSubmitting = signal(false);

  // Password Change
  passwordForm: FormGroup;
  isPasswordSubmitting = signal(false);

  // SMTP Config
  smtpForm: FormGroup;

  settingsData = signal<SettingsData | null>(null);

  constructor() {
    this.emailForm = this.fb.group({
      new_email: ['', [Validators.required, Validators.email]],
      otp: [''] // Added dynamically or handled via validations depending on state
    });

    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      new_password_confirmation: ['', Validators.required]
    });

    this.smtpForm = this.fb.group({
      host: ['', Validators.required],
      port: [587, [Validators.required, Validators.min(1)]],
      encryption: ['tls', Validators.required],
      username: ['', Validators.required],
      password: [''],
      from_name: ['', Validators.required],
      from_email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    this.loadSettings();
  }

  setTab(tab: SettingsTab) {
    this.activeTab.set(tab);
  }

  loadSettings() {
    this.isLoading.set(true);
    this.settingsService.getSettings().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.settingsData.set(res.data);
          this.smtpForm.patchValue(res.data.smtp);
          this.notificationEmails.set(res.data.notification_emails || []);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.show('Failed to load settings', 'error');
        this.isLoading.set(false);
      }
    });
  }

  // --- EMAIL CHANGE ---
  onRequestEmailChange() {
    if (this.emailForm.get('new_email')?.invalid) {
      this.emailForm.get('new_email')?.markAsTouched();
      return;
    }
    
    this.isEmailSubmitting.set(true);
    this.settingsService.sendOtp('email_change').subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.emailChangeState.set('verify');
        this.emailForm.get('otp')?.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(6)]);
        this.emailForm.get('otp')?.updateValueAndValidity();
        this.isEmailSubmitting.set(false);
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to send OTP', 'error');
        this.isEmailSubmitting.set(false);
      }
    });
  }

  onVerifyEmailChange() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isEmailSubmitting.set(true);
    const { new_email, otp } = this.emailForm.value;
    
    this.settingsService.changeEmail(new_email, otp).subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.emailChangeState.set('request');
        this.emailForm.reset();
        this.loadSettings();
        this.isEmailSubmitting.set(false);
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to change email', 'error');
        this.isEmailSubmitting.set(false);
      }
    });
  }

  cancelEmailChange() {
    this.emailChangeState.set('request');
    this.emailForm.get('otp')?.clearValidators();
    this.emailForm.get('otp')?.updateValueAndValidity();
    this.emailForm.reset();
  }

  // --- PASSWORD CHANGE ---
  onChangePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    if (this.passwordForm.value.new_password !== this.passwordForm.value.new_password_confirmation) {
      this.toastService.show('Passwords do not match', 'error');
      return;
    }

    this.isPasswordSubmitting.set(true);
    const payload = {
      current_password: this.passwordForm.value.current_password,
      new_password: this.passwordForm.value.new_password,
      new_password_confirmation: this.passwordForm.value.new_password_confirmation
    };

    // Note: this uses http.put, so we can cast via any or add to settings service
    // We added updatePasswordDirect in the backend. Let's use it.
    (this.settingsService as any).http.put(`${API_URL}/api/admin/settings/password/update-direct`, payload).subscribe({
      next: (res: any) => {
        this.toastService.show(res.message, 'success');
        this.passwordForm.reset();
        this.isPasswordSubmitting.set(false);
      },
      error: (err: any) => {
        this.toastService.show(err.error?.message || 'Failed to update password', 'error');
        this.isPasswordSubmitting.set(false);
      }
    });
  }

  // --- SMTP SETTINGS ---
  onSaveSmtp() {
    if (this.smtpForm.invalid) {
      this.smtpForm.markAllAsTouched();
      return;
    }

    this.isSavingSmtp.set(true);
    this.settingsService.updateSmtp(this.smtpForm.value).subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.loadSettings();
        this.isSavingSmtp.set(false);
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to save SMTP', 'error');
        this.isSavingSmtp.set(false);
      }
    });
  }

  onTestSmtp() {
    this.isTestingSmtp.set(true);
    this.settingsService.testSmtp().subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.isTestingSmtp.set(false);
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'SMTP Test Failed', 'error');
        this.isTestingSmtp.set(false);
      }
    });
  }
  // --- NOTIFICATIONS SETTINGS ---
  notificationEmails = signal<string[]>([]);
  newEmailInput = signal('');
  isSavingNotifications = signal(false);

  onAddNotificationEmail() {
    const email = this.newEmailInput().trim();
    if (!email) return;

    // basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.toastService.show('Please enter a valid email address', 'error');
      return;
    }

    if (this.notificationEmails().includes(email)) {
      this.toastService.show('Email already added', 'error');
      return;
    }

    this.notificationEmails.update(list => [...list, email]);
    this.newEmailInput.set('');
  }

  onRemoveNotificationEmail(email: string) {
    this.notificationEmails.update(list => list.filter(e => e !== email));
  }

  onSaveNotifications() {
    this.isSavingNotifications.set(true);
    this.settingsService.updateNotifications(this.notificationEmails()).subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.loadSettings();
        this.isSavingNotifications.set(false);
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to save notification settings', 'error');
        this.isSavingNotifications.set(false);
      }
    });
  }
}
