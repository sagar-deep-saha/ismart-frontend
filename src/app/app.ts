import { Component, signal, OnInit, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs/operators';
import AOS from 'aos';

import { LogoComponent } from './components/ui/logo/logo.component';

export interface SocialLink {
  id: number;
  platform: string;
  url: string | null;
  is_active: boolean;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, LogoComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('iSmart');
  protected readonly showScrollToTop = signal(false);
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly isLoading = signal(true);
  protected readonly isFadingOut = signal(false);
  protected readonly socialLinks = signal<SocialLink[]>([]);
  protected readonly contactSettings = signal<any>({
    business_email: 'Business.ismart@tripura.cloud',
    careers_email: 'careers.ismart@tripura.cloud',
    phone: '9101378960 / 8294464656',
    address: 'Jagatpur Kalibari Road (Opposite Roodraksh Kritisha), GB Bazar, Agartala- 799005, Tripura'
  });
  readonly isAdminRoute = signal(false);
  readonly activeSection = signal<string>('home');

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private router: Router
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || '';
      this.isAdminRoute.set(url.startsWith('/admin'));
      
      if (url.startsWith('/gallery')) {
        this.activeSection.set('gallery');
      } else if (url.startsWith('/join-us')) {
        this.activeSection.set('join-us');
      } else if (url.includes('#about')) {
        this.activeSection.set('about');
      } else if (url.includes('#services')) {
        this.activeSection.set('services');
      } else {
        this.activeSection.set('home');
      }
    });
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.showScrollToTop.set(window.scrollY > 500);

      // ScrollSpy logic for public home sections
      const url = this.router.url;
      if (!url.startsWith('/gallery') && !url.startsWith('/join-us') && !url.startsWith('/admin')) {
        const scrollPos = window.scrollY + 200; // offset for fixed header
        
        const aboutEl = document.getElementById('about');
        const servicesEl = document.getElementById('services');
        
        if (servicesEl && scrollPos >= servicesEl.offsetTop) {
          this.activeSection.set('services');
        } else if (aboutEl && scrollPos >= aboutEl.offsetTop) {
          this.activeSection.set('about');
        } else {
          this.activeSection.set('home');
        }
      }
    }
  }

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  fetchSocialLinks() {
    this.http.get<{ success: boolean; data: SocialLink[] }>('http://192.168.1.57:8004/api/social-links').subscribe({
      next: (res) => {
        this.socialLinks.set(res.data || []);
      },
      error: (err) => {
        console.error('Failed to load social links', err);
        this.socialLinks.set([]);
      }
    });
  }

  fetchContactSettings() {
    this.http.get<{ success: boolean; data: any }>('http://192.168.1.57:8004/api/settings/contact').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.contactSettings.set(res.data);
        }
      },
      error: (err) => {
        console.error('Failed to load contact settings', err);
      }
    });
  }

  ngOnInit() {
    this.fetchSocialLinks();
    this.fetchContactSettings();
    if (isPlatformBrowser(this.platformId)) {
      // 1. Minimum loader time of 2 seconds
      const minTimePromise = new Promise(resolve => setTimeout(resolve, 2000));
      
      // 2. Preload hero slider images
      const heroImages = [
        'slider/sl1.png', 'slider/sl2.png', 'slider/sl3.png', 'slider/sl4.png',
        'slider/sl5.png', 'slider/sl6.png', 'slider/sl7.png', 'slider/sl8.png'
      ];
      
      const imagePromises = heroImages.map(src => {
        return new Promise(resolve => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve; // resolve on error to prevent infinite loading
          img.src = src;
        });
      });
      
      // Wait for BOTH minimum time and all hero images to load
      Promise.all([minTimePromise, ...imagePromises]).then(() => {
        // Start crossfade transition
        this.isFadingOut.set(true);
        
        // Initialize AOS slightly after fade starts
        setTimeout(() => {
          AOS.init({
            duration: 800,
            once: true,
            offset: 100,
          });
        }, 100);

        // Remove loading screen from DOM after transition finishes
        setTimeout(() => {
          this.isLoading.set(false);
        }, 1000);
      });
    } else {
      this.isLoading.set(false);
      this.isFadingOut.set(true);
    }
  }
}
