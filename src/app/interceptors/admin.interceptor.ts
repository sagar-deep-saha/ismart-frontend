import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/admin/auth.service';
import { LoaderService } from '../services/loader.service';
import { ToastService } from '../services/toast.service';
import { catchError, finalize, throwError } from 'rxjs';

export const adminInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const loaderService = inject(LoaderService);
  const toastService = inject(ToastService);

  // Show spinner overlay for all requests
  loaderService.show();

  let authReq = req;
  const token = authService.getToken();
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((err) => {
      console.error('HTTP Error:', err);
      
      if (err.status === 401 && req.url.includes('/api/admin/')) {
        toastService.show('Session expired. Please login again.', 'error');
        authService.logout();
      } else {
        const errMsg = err.error?.message || err.error?.error || err.message || 'Server error occurred.';
        toastService.show(errMsg, 'error');
      }

      return throwError(() => err);
    }),
    finalize(() => {
      loaderService.hide();
    })
  );
};
