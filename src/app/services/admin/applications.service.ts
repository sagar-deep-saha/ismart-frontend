import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_URL } from './config';

export interface ApplicationItem {
  id: number;
  reference_number: string;
  team_name: string;
  sector: string;
  stage: string;
  status: string;
  created_at: string;
}

export interface ApplicationsResponse {
  data: ApplicationItem[];
  meta: {
    total: number;
    page: number;
    last_page: number;
  };
}

export interface Member {
  name: string;
  role: string;
}

export interface ApplicationDetail {
  id: number;
  reference_number: string;
  team_name: string;
  member_count: number;
  registration_status: string;
  lead_name: string;
  lead_role: string;
  lead_phone: string;
  lead_whatsapp?: string;
  lead_email?: string;
  lead_district: string;
  members: Member[];
  sector: string;
  stage: string;
  description?: string;
  support_types: string[];
  consent: boolean;
  status: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationsService {
  constructor(private http: HttpClient) {}

  getApplications(params: {
    page: number;
    limit: number;
    status?: string;
    sector?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
  }): Observable<ApplicationsResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('per_page', params.limit.toString());

    if (params.status) httpParams = httpParams.set('status', params.status.toLowerCase());
    if (params.sector) httpParams = httpParams.set('sector', params.sector);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.start_date) httpParams = httpParams.set('date', params.start_date);

    return this.http.get<any>(`${API_URL}/api/admin/applications`, { params: httpParams }).pipe(
      map(res => {
        const rawList = res.data || [];
        const mappedList: ApplicationItem[] = rawList.map((team: any) => ({
          id: team.id,
          reference_number: team.reference_number,
          team_name: team.name,
          sector: team.business_detail?.sector || 'Other',
          stage: team.business_detail?.stage || 'Idea',
          status: team.status.charAt(0).toUpperCase() + team.status.slice(1).toLowerCase(),
          created_at: team.created_at
        }));
        
        return {
          data: mappedList,
          meta: {
            total: res.meta?.total || 0,
            page: res.meta?.current_page || 1,
            last_page: res.meta?.last_page || 1
          }
        };
      })
    );
  }

  getApplication(id: number): Observable<ApplicationDetail> {
    return this.http.get<any>(`${API_URL}/api/admin/applications/${id}`).pipe(
      map(res => {
        const team = res.data;
        const lead = (team.members || []).find((m: any) => m.is_lead);
        const additionalMembers = (team.members || []).filter((m: any) => !m.is_lead);

        return {
          id: team.id,
          reference_number: team.reference_number,
          team_name: team.name,
          member_count: team.member_count,
          registration_status: team.registration_status,
          
          lead_name: lead ? lead.name : '',
          lead_role: lead ? lead.role : '',
          lead_phone: lead ? lead.phone : '',
          lead_whatsapp: lead ? lead.whatsapp_number : '',
          lead_email: lead ? lead.email : '',
          lead_district: lead ? lead.district : '',

          members: additionalMembers.map((m: any) => ({
            name: m.name,
            role: m.role
          })),

          sector: team.business_detail?.sector || 'Other',
          stage: team.business_detail?.stage || 'Idea',
          description: team.business_detail?.description,
          
          support_types: team.support_types || [],
          consent: !!team.consent,
          status: team.status.charAt(0).toUpperCase() + team.status.slice(1).toLowerCase(),
          created_at: team.created_at
        };
      })
    );
  }

  updateStatus(id: number, status: string): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(`${API_URL}/api/admin/applications/${id}/status`, { status: status.toLowerCase() });
  }
}
