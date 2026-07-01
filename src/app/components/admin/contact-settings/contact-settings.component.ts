import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SettingsService, ContactConfig } from '../../../services/admin/settings.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-contact-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './contact-settings.component.html'
})
export class ContactSettingsComponent implements OnInit {
  contactForm: FormGroup;
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private toastService: ToastService
  ) {
    this.contactForm = this.fb.group({
      business_email: ['', [Validators.email]],
      careers_email: ['', [Validators.email]],
      phone: ['', [Validators.maxLength(255)]],
      address: ['', [Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading.set(true);
    this.settingsService.getSettings().subscribe({
      next: (res) => {
        if (res.success && res.data.contact) {
          this.contactForm.patchValue({
            business_email: res.data.contact.business_email,
            careers_email: res.data.contact.careers_email,
            phone: res.data.contact.phone,
            address: res.data.contact.address
          });
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toastService.show('Failed to load contact settings', 'error');
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const payload: Partial<ContactConfig> = this.contactForm.value;

    this.settingsService.updateContact(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.show(res.message, 'success');
        }
        this.isSaving.set(false);
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to update contact settings', 'error');
        this.isSaving.set(false);
      }
    });
  }
}
