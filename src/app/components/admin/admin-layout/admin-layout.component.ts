import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../services/admin/auth.service';
import { ToastService } from '../../../services/toast.service';
import { LoaderService } from '../../../services/loader.service';

@Component({
  selector: 'admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  loaderService = inject(LoaderService);
  router = inject(Router);

  isSidebarOpen = signal(false);

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }

  onLogout() {
    this.authService.logout();
    this.toastService.show('Logged out successfully', 'info');
  }
}
