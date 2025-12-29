import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { Firestore } from '@angular/fire/firestore';
import { forkJoin, Subscription } from 'rxjs';
import * as Papa from 'papaparse';

import { Constants } from '../app.constants';
import { ReviewService } from '../services/reviews.service';
import { ContactComponent } from '../contact/contact.component';
import { CommonService } from '../services/common.service';

interface CardItem {
  category: string;
  image: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CarouselModule, ContactComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  /* ================== UI STATE ================== */
  showLaunch = true;

  /* ================== DATA ================== */
  cards: CardItem[] = [];
  originalsAndPrints: CardItem[] = [];
  workshops: CardItem[] = [];
  recordings: CardItem[] = [];
  galleryImages: string[] = [];
  approvedReviews: any[] = [];
  emailId = '';

  /* ================== CAROUSEL ================== */
  currentIndex = 0;
  currentIndexReviews = 0;
  private slideInterval?: number;

  /* ================== CONSTANTS ================== */
  private sheetUrl = Constants.SheetUrls.CoverPage;
  private gallerySheetUrl = Constants.SheetUrls.Gallery;
  private adminSheetUrl = Constants.SheetUrls.Admin;

  private subscriptions = new Subscription();

  constructor(
    private http: HttpClient,
    private router: Router,
    private firestore: Firestore,
    private reviewsService: ReviewService,
    private commonService: CommonService
  ) {}

  /* ================== INIT ================== */
  ngOnInit(): void {
    // If cache exists → skip launcher entirely
    if (this.loadFromCache()) {
      this.showLaunch = false;
      return;
    }

    // Fresh load → show launcher and block scroll
    document.body.style.overflow = 'hidden';
    this.showLaunch = true;

    this.loadHomeData();
    this.startAutoSlides();
  }

  ngOnDestroy(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
    this.subscriptions.unsubscribe();
  }

  /* ================== DATA LOADING ================== */
  private loadHomeData(): void {
  // Load coverPage
  this.http.get(this.sheetUrl, { responseType: 'text' }).subscribe({
    next: csv => {
      this.parseCoverPage(csv);
      this.cacheData();
    },
    error: err => console.error('CoverPage error', err)
  });

  // Load gallery
  this.http.get(this.gallerySheetUrl, { responseType: 'text' }).subscribe({
    next: csv => {
      this.parseGallery(csv);
      this.cacheData();
    },
    error: err => console.error('Gallery error', err)
  });

  // Load admin
  this.http.get(this.adminSheetUrl, { responseType: 'text' }).subscribe({
    next: csv => this.parseAdmin(csv),
    error: err => console.error('Admin error', err)
  });

  // Load reviews
  this.subscriptions.add(
    this.reviewsService.getApprovedReviews().subscribe(reviews => {
      this.approvedReviews = reviews;
      localStorage.setItem('home_reviews', JSON.stringify(reviews));
    })
  );

  // Finish launch independently after some delay or condition
  setTimeout(() => this.finishLaunch(), 1500); // or another condition
  // this.finishLaunch()
}

  /* ================== PARSERS ================== */
  private parseCoverPage(csv: string): void {
    this.cards = [];

    const rows = csv.split('\n');
    const headers = rows[0].split(',');

    rows.slice(1).forEach(row => {
      const cols = row.split(',');
      headers.forEach((header, i) => {
        if (cols[i]?.trim()) {
          this.cards.push({
            category: header.trim(),
            image: this.commonService.convertDriveToThumbnail(cols[i].trim())
          });
        }

        console.log(this.cards)
      });
    });

    this.groupCards();
  }

  private parseGallery(csv: string): void {
    this.galleryImages = csv
      .split('\n')
      .slice(1)
      .map(r => r.trim())
      .filter(Boolean)
      .map(url => this.commonService.convertDriveToThumbnail(url));
  }

  private parseAdmin(csv: string): void {
    Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      complete: result => {
        const rows = result.data as any[];
        if (rows.length) {
          this.emailId = rows[0]['EmailId'] || '';
        }
      }
    });
  }

  /* ================== CACHE ================== */
  private loadFromCache(): boolean {
    const cacheTime = Number(localStorage.getItem('home_cache_time'));
    const CACHE_DURATION = 60 * 1000; // 30 minutes

    if (!cacheTime || Date.now() - cacheTime > CACHE_DURATION) {
      return false;
    }

    try {
      this.cards = JSON.parse(localStorage.getItem('home_cards') || '[]');
      this.galleryImages = JSON.parse(localStorage.getItem('home_gallery') || '[]');
      this.approvedReviews = JSON.parse(localStorage.getItem('home_reviews') || '[]');
      this.emailId =
        JSON.parse(localStorage.getItem('home_admin') || '{}').emailId || '';

      this.groupCards();
      this.startAutoSlides();
      return true;
    } catch {
      return false;
    }
  }

  private cacheData(): void {
    localStorage.setItem('home_cards', JSON.stringify(this.cards));
    localStorage.setItem('home_gallery', JSON.stringify(this.galleryImages));
    localStorage.setItem('home_admin', JSON.stringify({ emailId: this.emailId }));
    localStorage.setItem('home_cache_time', Date.now().toString());
  }

  /* ================== LAUNCH CONTROL ================== */
  private finishLaunch(): void {
    this.showLaunch = false;
    document.body.style.overflow = '';
  }

  /* ================== GROUPING ================== */
  private groupCards(): void {
    this.originalsAndPrints = this.cards.filter(
      c => c.category === 'Originals' || c.category === 'Prints'
    );
    this.workshops = this.cards.filter(c => c.category === 'Workshops');
    this.recordings = this.cards.filter(
      c => c.category === 'Workshop Recordings'
    );
  }

  /* ================== SLIDES ================== */
  private startAutoSlides(): void {
    this.slideInterval = window.setInterval(() => {
      this.nextSlide();
      this.nextSlideReviews();
    }, 3000);
  }

  get itemsPerSlide(): number {
    if (window.innerWidth <= 768) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  get totalSlides(): number {
    return Math.ceil(this.galleryImages.length / this.itemsPerSlide);
  }

  nextSlide(): void {
    this.currentIndex = (this.currentIndex + 1) % this.totalSlides;
  }

  prevSlide(): void {
    this.currentIndex =
      this.currentIndex === 0 ? this.totalSlides - 1 : this.currentIndex - 1;
  }

  nextSlideReviews(): void {
    if (!this.approvedReviews.length) return;
    this.currentIndexReviews =
      (this.currentIndexReviews + 1) % this.approvedReviews.length;
  }

  prevSlideReviews(): void {
    if (!this.approvedReviews.length) return;
    this.currentIndexReviews =
      this.currentIndexReviews === 0
        ? this.approvedReviews.length - 1
        : this.currentIndexReviews - 1;
  }

  /* ================== NAVIGATION ================== */
  goToCategory(category: string): void {
    const routes: Record<string, string> = {
      Originals: '/originals',
      Prints: '/prints',
      Workshops: '/workshops',
      'Workshop Recordings': '/recordings'
    };

    if (routes[category]) {
      this.router.navigate([routes[category]]);
    }
  }

  goToGallery(): void {
    this.router.navigate(['/gallery']);
  }
}
