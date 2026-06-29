import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AnalyticsService, AnalyticsData } from '../../../services/admin/analytics.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  analyticsService = inject(AnalyticsService);
  toastService = inject(ToastService);
  router = inject(Router);

  analyticsData = signal<AnalyticsData | null>(null);
  isLoading = signal(true);

  // Computations for Sector Chart (Bar Chart)
  maxSectorCount = computed(() => {
    const data = this.analyticsData()?.sectors_chart || [];
    return Math.max(...data.map(d => d.count), 1);
  });

  // Computations for Status Chart (Donut Chart)
  donutSegments = computed(() => {
    const data = this.analyticsData()?.status_chart || [];
    const total = data.reduce((sum, item) => sum + item.count, 0) || 1;
    let accumulatedPercent = 0;
    
    return data.map(item => {
      const percent = (item.count / total) * 100;
      const strokeDasharray = `${percent} ${100 - percent}`;
      const strokeDashoffset = (100 - accumulatedPercent + 25) % 100; // rotate start to 12 o'clock
      accumulatedPercent += percent;

      // Color mapping
      let colorClass = '#cbd5e1'; 
      let borderClass = 'bg-slate-500';
      if (item.status.toLowerCase() === 'pending') {
        colorClass = '#64748b'; // Slate-500
        borderClass = 'bg-slate-500';
      } else if (item.status.toLowerCase() === 'reviewed') {
        colorClass = '#475569'; // Slate-600
        borderClass = 'bg-slate-600';
      } else if (item.status.toLowerCase() === 'accepted') {
        colorClass = '#0D5C75'; // Brand Primary Teal
        borderClass = 'bg-brand-primary';
      } else if (item.status.toLowerCase() === 'rejected') {
        colorClass = '#94a3b8'; // Slate-400
        borderClass = 'bg-slate-400';
      }

      return {
        ...item,
        percent,
        strokeDasharray,
        strokeDashoffset,
        colorClass,
        borderClass
      };
    });
  });

  // Computations for Support Chart (List chart)
  maxSupportCount = computed(() => {
    const data = this.analyticsData()?.support_types_chart || [];
    return Math.max(...data.map(d => d.count), 1);
  });

  // Computations for District Chart (Horizontal Bar Chart)
  maxDistrictCount = computed(() => {
    const data = this.analyticsData()?.districts_chart || [];
    return Math.max(...data.map(d => d.count), 1);
  });

  ngOnInit() {
    this.fetchAnalytics();
  }

  fetchAnalytics() {
    this.isLoading.set(true);
    this.analyticsService.getAnalytics().subscribe({
      next: (data: any) => {
        this.analyticsData.set(data);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        console.error('Failed to load dashboard metrics', err);
        const errMsg = err.error?.message || err.error?.error || 'Failed to load dashboard analytics from database.';
        this.toastService.show(errMsg, 'error');
      }
    });
  }

  viewApplication(id: number) {
    this.router.navigate(['/admin/applications', id]);
  }
}
