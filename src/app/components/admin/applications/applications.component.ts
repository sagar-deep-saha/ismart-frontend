import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ApplicationsService, ApplicationItem } from '../../../services/admin/applications.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'admin-applications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './applications.component.html'
})
export class ApplicationsComponent implements OnInit {
  applicationsService = inject(ApplicationsService);
  toastService = inject(ToastService);
  router = inject(Router);
  fb = inject(FormBuilder);

  filterForm!: FormGroup;
  applications = signal<ApplicationItem[]>([]);
  isLoading = signal(true);

  // Pagination fields
  currentPage = signal(1);
  pageSize = signal(8);
  totalItems = signal(0);
  lastPage = signal(1);

  sectors = [
    'Agriculture / Farming',
    'Food Processing',
    'Handicraft / Weaving',
    'Retail / Shop',
    'Services (tailoring, beauty, etc.)',
    'Digital / Tech',
    'Health & Wellness',
    'Education',
    'Other'
  ];

  statuses = ['Pending', 'Reviewed', 'Accepted', 'Rejected'];

  constructor() {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      sector: [''],
      startDate: [''],
      endDate: ['']
    });

    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.fetchApplications();
    });
  }

  ngOnInit() {
    this.fetchApplications();
  }

  fetchApplications() {
    this.isLoading.set(true);
    const filters = this.filterForm.value;

    this.applicationsService.getApplications({
      page: this.currentPage(),
      limit: this.pageSize(),
      status: filters.status || undefined,
      sector: filters.sector || undefined,
      search: filters.search || undefined,
      start_date: filters.startDate || undefined,
      end_date: filters.endDate || undefined
    }).subscribe({
      next: (res: any) => {
        this.applications.set(res.data);
        this.totalItems.set(res.meta.total);
        this.lastPage.set(res.meta.last_page);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.applications.set([]);
        this.totalItems.set(0);
        this.lastPage.set(1);
        console.error('Failed to load applications', err);
        const errMsg = err.error?.message || err.error?.error || 'Failed to load applications from database.';
        this.toastService.show(errMsg, 'error');
      }
    });
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.lastPage()) return;
    this.currentPage.set(page);
    this.fetchApplications();
  }

  viewApplication(id: number) {
    this.router.navigate(['/admin/applications', id]);
  }

  clearFilters() {
    this.filterForm.patchValue({
      search: '',
      status: '',
      sector: '',
      startDate: '',
      endDate: ''
    });
  }
}
