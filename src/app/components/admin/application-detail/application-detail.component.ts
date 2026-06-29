import { Component, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ApplicationsService, ApplicationDetail } from '../../../services/admin/applications.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'admin-application-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './application-detail.component.html'
})
export class ApplicationDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  applicationsService = inject(ApplicationsService);
  toastService = inject(ToastService);
  platformId = inject(PLATFORM_ID);

  application = signal<ApplicationDetail | null>(null);
  isLoading = signal(true);

  // Collapsible section toggles
  showOverview = signal(true);
  showLead = signal(true);
  showMembers = signal(true);
  showBusiness = signal(true);
  showSupport = signal(true);

  // Status Form state
  selectedStatus = signal<string>('Pending');
  isSavingStatus = signal(false);

  statuses = ['Pending', 'Reviewed', 'Accepted', 'Rejected'];

  ngOnInit() {
    this.fetchDetails();
  }

  fetchDetails() {
    this.isLoading.set(true);
    const id = Number(this.route.snapshot.params['id']);

    this.applicationsService.getApplication(id).subscribe({
      next: (data) => {
        this.application.set(data);
        this.selectedStatus.set(data.status);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.application.set(null);
        console.error('Failed to load application details', err);
        const errMsg = err.error?.message || err.error?.error || 'Failed to load application details from database.';
        this.toastService.show(errMsg, 'error');
        this.router.navigate(['/admin/applications']);
      }
    });
  }

  onStatusChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedStatus.set(value);
  }

  onSaveStatus() {
    const app = this.application();
    if (!app) return;

    this.isSavingStatus.set(true);
    this.applicationsService.updateStatus(app.id, this.selectedStatus()).subscribe({
      next: (res: any) => {
        this.isSavingStatus.set(false);
        this.application.update(current => current ? { ...current, status: this.selectedStatus() } : null);
        this.toastService.show(`Status updated to ${this.selectedStatus()} successfully`, 'success');
      },
      error: (err: any) => {
        this.isSavingStatus.set(false);
        console.error('Failed to update status', err);
        const errMsg = err.error?.message || err.error?.error || 'Failed to update application status in database.';
        this.toastService.show(errMsg, 'error');
      }
    });
  }

  toggleSection(section: 'overview' | 'lead' | 'members' | 'business' | 'support') {
    if (section === 'overview') this.showOverview.update(v => !v);
    else if (section === 'lead') this.showLead.update(v => !v);
    else if (section === 'members') this.showMembers.update(v => !v);
    else if (section === 'business') this.showBusiness.update(v => !v);
    else if (section === 'support') this.showSupport.update(v => !v);
  }

  downloadPdf() {
    if (!isPlatformBrowser(this.platformId)) return;

    const originalState = {
      overview: this.showOverview(),
      lead: this.showLead(),
      members: this.showMembers(),
      business: this.showBusiness(),
      support: this.showSupport()
    };

    this.showOverview.set(true);
    this.showLead.set(true);
    this.showMembers.set(true);
    this.showBusiness.set(true);
    this.showSupport.set(true);

    setTimeout(() => {
      window.print();

      this.showOverview.set(originalState.overview);
      this.showLead.set(originalState.lead);
      this.showMembers.set(originalState.members);
      this.showBusiness.set(originalState.business);
      this.showSupport.set(originalState.support);
    }, 300);
  }
}
