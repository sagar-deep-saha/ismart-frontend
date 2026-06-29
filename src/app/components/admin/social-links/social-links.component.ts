import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SocialLinksService, SocialLink } from '../../../services/admin/social-links.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'admin-social-links',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './social-links.component.html'
})
export class SocialLinksComponent implements OnInit {
  socialService = inject(SocialLinksService);
  toastService = inject(ToastService);
  fb = inject(FormBuilder);

  linksForm: FormGroup;
  isLoading = signal(true);
  isSaving = signal(false);

  constructor() {
    this.linksForm = this.fb.group({
      items: this.fb.array([])
    });
  }

  get items(): FormArray {
    return this.linksForm.get('items') as FormArray;
  }

  ngOnInit() {
    this.fetchSocialLinks();
  }

  fetchSocialLinks() {
    this.isLoading.set(true);
    this.socialService.getLinks().subscribe({
      next: (data) => {
        this.populateForm(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Failed to load social links', err);
        const errMsg = err.error?.message || err.error?.error || 'Failed to load social links from database.';
        this.toastService.show(errMsg, 'error');
      }
    });
  }

  populateForm(links: SocialLink[]) {
    while (this.items.length) {
      this.items.removeAt(0);
    }

    links.forEach(link => {
      this.items.push(this.fb.group({
        id: [link.id],
        platform: [link.platform],
        url: [link.url || ''],
        is_active: [link.is_active]
      }));
    });
  }

  onSubmit() {
    if (this.linksForm.invalid) {
      return;
    }

    this.isSaving.set(true);
    const formValues = this.items.value;
    
    const requests = formValues.map((item: any) => {
      const formattedUrl = item.url.trim() || null;
      return this.socialService.updateLink(item.id, formattedUrl, item.is_active).pipe(
        catchError(err => {
          console.error(`Failed to update ${item.platform}`, err);
          return of(null);
        })
      );
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.show('All changes saved successfully', 'success');
        this.fetchSocialLinks();
      },
      error: (err) => {
        this.isSaving.set(false);
        const errMsg = err.error?.message || err.error?.error || 'Failed to update social links in database.';
        this.toastService.show(errMsg, 'error');
      }
    });
  }
}
