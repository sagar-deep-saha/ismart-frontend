import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_URL } from './config';

export interface AnalyticsData {
  total_applications: number;
  this_month_applications: number;
  accepted_applications: number;
  pending_applications: number;
  sectors_chart: { sector: string; count: number }[];
  status_chart: { status: string; count: number }[];
  support_types_chart: { support_type: string; count: number }[];
  districts_chart: { district: string; count: number }[];
  recent_applications: {
    id: number;
    reference_number: string;
    team_name: string;
    status: string;
    created_at: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private http: HttpClient) {}

  getAnalytics(): Observable<AnalyticsData> {
    return this.http.get<{ success: boolean; data: any }>(`${API_URL}/api/admin/analytics`).pipe(
      map(res => {
        const raw = res.data;
        
        const sectors_chart = Object.entries(raw.by_sector || {}).map(([sector, count]) => ({
          sector: sector.charAt(0).toUpperCase() + sector.slice(1).replace('_', ' '),
          count: count as number
        })).sort((a, b) => b.count - a.count);

        const districts_chart = Object.entries(raw.by_district || {}).map(([district, count]) => ({
          district: district as string,
          count: count as number
        })).sort((a, b) => b.count - a.count);

        const support_types_chart = Object.entries(raw.by_support_type || {}).map(([support_type, count]) => ({
          support_type: support_type.charAt(0).toUpperCase() + support_type.slice(1).replace('_', ' '),
          count: count as number
        })).sort((a, b) => b.count - a.count);

        const status_chart = [
          { status: 'Accepted', count: raw.by_status?.accepted || 0 },
          { status: 'Pending', count: raw.by_status?.pending || 0 },
          { status: 'Reviewed', count: raw.by_status?.reviewed || 0 },
          { status: 'Rejected', count: raw.by_status?.rejected || 0 }
        ];

        const recent_applications = (raw.recent_applications || []).map((app: any) => ({
          id: app.id,
          reference_number: app.reference_number,
          team_name: app.name,
          status: app.status.charAt(0).toUpperCase() + app.status.slice(1).toLowerCase(),
          created_at: app.created_at
        }));

        return {
          total_applications: raw.total_applications || 0,
          this_month_applications: raw.applications_this_month || 0,
          accepted_applications: raw.by_status?.accepted || 0,
          pending_applications: raw.by_status?.pending || 0,
          sectors_chart,
          status_chart,
          support_types_chart,
          districts_chart,
          recent_applications
        };
      })
    );
  }
}
