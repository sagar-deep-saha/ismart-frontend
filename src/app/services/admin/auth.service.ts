import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL } from './config';

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    admin: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'admin_token';
  readonly isLoggedIn = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.isLoggedIn.set(this.hasToken());
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_URL}/api/admin/login`, { email, password }).pipe(
      tap(res => {
        if (res?.success && res.data?.token) {
          localStorage.setItem(this.tokenKey, res.data.token);
          this.isLoggedIn.set(true);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.isLoggedIn.set(false);
    this.router.navigate(['/admin/login']);
  }

  forgotPasswordSendOtp(email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${API_URL}/api/admin/forgot-password/otp`, { email });
  }

  forgotPasswordReset(email: string, otp: string, password: string, password_confirmation: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${API_URL}/api/admin/forgot-password/reset`, { email, otp, password, password_confirmation });
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }
}
