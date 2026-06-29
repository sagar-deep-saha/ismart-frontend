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
  age?: number;
  gender?: string;
  phone?: string;
  education?: string;
  groups?: string[];
}

export interface ApplicationDetail {
  id: number;
  reference_number: string;
  team_name: string;
  tagline?: string;
  member_count: number;
  formed_since?: string;
  registration_status: string;
  lead_name: string;
  lead_role: string;
  lead_age: number;
  lead_gender: string;
  lead_phone: string;
  lead_whatsapp?: string;
  lead_email?: string;
  lead_district: string;
  lead_block: string;
  lead_village: string;
  lead_education: string;
  lead_groups: string[];
  members: Member[];
  sector: string;
  stage: string;
  duration_working: string;
  monthly_revenue: string;
  description?: string;
  problem_solved?: string;
  target_customers?: string;
  support_types: string[];
  prev_gov_support: boolean;
  prev_gov_support_details?: string;
  device_access: string;
  languages: string[];
  how_heard: string;
  preferred_contact_time: string;
  pitch_deck_path?: string;
  additional_message?: string;
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
          tagline: team.tagline,
          member_count: team.member_count,
          formed_since: team.formed_since,
          registration_status: team.registration_status,
          
          lead_name: lead ? lead.name : '',
          lead_role: lead ? lead.role : '',
          lead_age: lead ? lead.age : 0,
          lead_gender: lead ? lead.gender : '',
          lead_phone: lead ? lead.phone : '',
          lead_whatsapp: lead ? lead.whatsapp_number : '',
          lead_email: lead ? lead.email : '',
          lead_district: lead ? lead.district : '',
          lead_block: lead ? lead.block : '',
          lead_village: lead ? lead.village : '',
          lead_education: lead ? lead.education : '',
          lead_groups: lead ? (lead.groups || []) : [],

          members: additionalMembers.map((m: any) => ({
            name: m.name,
            role: m.role,
            age: m.age,
            gender: m.gender,
            phone: m.phone,
            education: m.education,
            groups: m.groups || []
          })),

          sector: team.business_detail?.sector || 'Other',
          stage: team.business_detail?.stage || 'Idea',
          duration_working: team.business_detail?.duration_working || '',
          monthly_revenue: team.business_detail?.monthly_revenue || '',
          description: team.business_detail?.description,
          problem_solved: team.business_detail?.problem_solved,
          target_customers: team.business_detail?.target_customers,
          
          support_types: team.support_types || [],
          prev_gov_support: !!team.prev_gov_support,
          prev_gov_support_details: team.prev_gov_support_details,
          device_access: team.device_access,
          languages: team.languages || [],
          how_heard: team.how_heard,
          preferred_contact_time: team.preferred_contact_time,
          pitch_deck_path: team.pitch_deck_url || team.pitch_deck_path,
          additional_message: team.additional_message,
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
