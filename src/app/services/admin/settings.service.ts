import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from './config';

export interface SmtpConfig {
  host: string;
  port: number;
  encryption: 'tls' | 'ssl' | 'none';
  username: string;
  password: string | null;
  from_name: string;
  from_email: string;
}

export interface SettingsData {
  admin: { name: string; email: string };
  smtp: SmtpConfig;
  smtp_configured: boolean;
  notification_emails: string[];
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private http: HttpClient) {}

  getSettings(): Observable<{ success: boolean; data: SettingsData }> {
    return this.http.get<{ success: boolean; data: SettingsData }>(`${API_URL}/api/admin/settings`);
  }

  updateSmtp(payload: Partial<SmtpConfig>): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${API_URL}/api/admin/settings/smtp`, payload);
  }

  updateNotifications(emails: string[]): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${API_URL}/api/admin/settings/notifications`, { emails });
  }

  sendOtp(purpose: 'email_change' | 'password_change'): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${API_URL}/api/admin/settings/otp/send`, { purpose });
  }

  changeEmail(new_email: string, otp: string): Observable<{ success: boolean; message: string; new_email?: string }> {
    return this.http.post<{ success: boolean; message: string; new_email?: string }>(`${API_URL}/api/admin/settings/email/change`, { new_email, otp });
  }

  changePassword(new_password: string, new_password_confirmation: string, otp: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${API_URL}/api/admin/settings/password/change`, { new_password, new_password_confirmation, otp });
  }

  testSmtp(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${API_URL}/api/admin/settings/smtp/test`, {});
  }
}
