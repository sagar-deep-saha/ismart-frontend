import { Component, OnInit, HostListener, Inject, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface GalleryImage {
  id: number;
  title?: string;
  description?: string;
  image_path: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './gallery.component.html'
})
export class GalleryComponent implements OnInit {
  protected readonly images = signal<GalleryImage[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly activeImageIndex = signal<number | null>(null);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.fetchImages();
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo(0, 0);
    }
  }

  fetchImages() {
    this.isLoading.set(true);
    this.http.get<{ success: boolean; data: any[] }>(`${environment.apiUrl}/gallery`).subscribe({
      next: (res) => {
        // Only show active and sorted by sort_order
        const sorted = (res.data || [])
          .map((img: any) => ({
            id: img.id,
            title: img.title,
            description: img.description,
            image_path: img.url,
            is_active: !!img.is_active,
            sort_order: img.sort_order,
            created_at: img.created_at
          }))
          .filter(img => img.is_active)
          .sort((a, b) => a.sort_order - b.sort_order);
        this.images.set(sorted);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch gallery images', err);
        this.images.set([]);
        this.isLoading.set(false);
      }
    });
  }

  openLightbox(index: number) {
    this.activeImageIndex.set(index);
  }

  closeLightbox() {
    this.activeImageIndex.set(null);
  }

  nextImage(event?: Event) {
    if (event) event.stopPropagation();
    const index = this.activeImageIndex();
    if (index === null) return;
    const nextIdx = (index + 1) % this.images().length;
    this.activeImageIndex.set(nextIdx);
  }

  prevImage(event?: Event) {
    if (event) event.stopPropagation();
    const index = this.activeImageIndex();
    if (index === null) return;
    const prevIdx = (index - 1 + this.images().length) % this.images().length;
    this.activeImageIndex.set(prevIdx);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.activeImageIndex() === null) return;
    
    if (event.key === 'Escape') {
      this.closeLightbox();
    } else if (event.key === 'ArrowRight') {
      this.nextImage();
    } else if (event.key === 'ArrowLeft') {
      this.prevImage();
    }
  }
}
