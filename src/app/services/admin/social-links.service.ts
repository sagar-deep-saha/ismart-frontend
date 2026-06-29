import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_URL } from './config';

export interface SocialLink {
  id: number;
  platform: string;
  url: string | null;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SocialLinksService {
  constructor(private http: HttpClient) {}

  getLinks(): Observable<SocialLink[]> {
    return this.http.get<{ success: boolean; data: SocialLink[] }>(`${API_URL}/api/admin/social-links`).pipe(
      map(res => res.data || [])
    );
  }

  updateLink(id: number, url: string | null, is_active: boolean): Observable<SocialLink> {
    return this.http.patch<{ success: boolean; data: SocialLink }>(`${API_URL}/api/admin/social-links/${id}`, { url, is_active }).pipe(
      map(res => res.data)
    );
  }
}
