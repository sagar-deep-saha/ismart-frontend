import { Component, signal, ElementRef, ViewChild, AfterViewInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html'
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  activities = Array.from({ length: 31 }, (_, i) => {
    const num = i + 1;
    return `activities/activity${num}.${num === 16 ? 'jpg' : 'png'}`;
  });

  visibleActivities = signal(12);

  loadMore() {
    this.visibleActivities.update(n => n + 12);
  }

  impactStats = [
    { target: 3000, current: signal(0), label: 'SHGs trained', suffix: '+' },
    { target: 1150, current: signal(0), label: 'Entrepreneurs supported', suffix: '+' },
    { target: 12, current: signal(0), label: 'FPOs incubated', suffix: '+' },
    { target: 700, current: signal(0), label: 'Digitally empowered individuals', suffix: '+' },
    { target: 135, current: signal(0), label: 'EDP Training', suffix: '+' }
  ];

  @ViewChild('impactSection') impactSection!: ElementRef;
  private observer: IntersectionObserver | null = null;
  private countInterval: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId) && this.impactSection) {
      this.observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          this.startCounting();
        }
      }, { threshold: 0.15 });
      this.observer.observe(this.impactSection.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.countInterval) {
      clearInterval(this.countInterval);
    }
  }

  startCounting() {
    if (this.countInterval) {
      clearInterval(this.countInterval);
    }
    
    // Reset to 0 before counting
    this.impactStats.forEach(stat => stat.current.set(0));

    const duration = 2500; // Increased duration to 2.5s
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;

    this.countInterval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      this.impactStats.forEach(stat => {
        stat.current.set(Math.floor(stat.target * easeProgress));
      });

      if (frame >= totalFrames) {
        clearInterval(this.countInterval);
        this.impactStats.forEach(stat => stat.current.set(stat.target));
      }
    }, frameDuration);
  }
}
