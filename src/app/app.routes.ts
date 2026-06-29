import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./components/home/home.component').then(c => c.HomeComponent) },
  { path: 'join-us', loadComponent: () => import('./components/join-us/join-us.component').then(c => c.JoinUsComponent) },
  { path: 'gallery', loadComponent: () => import('./components/gallery/gallery.component').then(c => c.GalleryComponent) },
  { path: 'terms-of-service', loadComponent: () => import('./components/terms-of-service/terms-of-service.component').then(c => c.TermsOfServiceComponent) },
  { path: 'privacy-policy', loadComponent: () => import('./components/privacy-policy/privacy-policy.component').then(c => c.PrivacyPolicyComponent) },
  
  // ADMIN PANEL ENDPOINTS
  {
    path: 'admin/login',
    loadComponent: () => import('./components/admin/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./components/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'applications',
        loadComponent: () => import('./components/admin/applications/applications.component').then(m => m.ApplicationsComponent)
      },
      {
        path: 'applications/:id',
        loadComponent: () => import('./components/admin/application-detail/application-detail.component').then(m => m.ApplicationDetailComponent)
      },
      {
        path: 'gallery',
        loadComponent: () => import('./components/admin/gallery/gallery.component').then(m => m.GalleryComponent)
      },
      {
        path: 'social-links',
        loadComponent: () => import('./components/admin/social-links/social-links.component').then(m => m.SocialLinksComponent)
      }
    ]
  },
  
  { path: '**', redirectTo: '' }
];

