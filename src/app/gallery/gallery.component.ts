import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LoaderService } from '../services/loader.service';
import { Constants } from '../app.constants';
import { CommonService } from '../services/common.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {

  galleryImages: string[] = [];

  private readonly gallerySheetUrl = Constants.SheetUrls.Gallery;
  private readonly cacheKey = 'gallery_cache';
  private readonly cacheTimeKey = 'gallery_cache_time';
  private readonly cacheDuration = 1 * 1000; // 30 minutes

  constructor(private http: HttpClient, private loader: LoaderService, private commonService: CommonService) {}

  ngOnInit(): void {
    this.loader.show();

    if (this.loadFromCache()) {
      this.loader.hide();
    } else {
      this.loadFromSheet();
    }
  }

  /** ================== CACHE ================== */
  private loadFromCache(): boolean {
    const cachedTime = Number(localStorage.getItem(this.cacheTimeKey));
    if (!cachedTime || Date.now() - cachedTime > this.cacheDuration) {
      return false;
    }

    try {
      const cachedData = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
      if (Array.isArray(cachedData) && cachedData.length) {
        this.galleryImages = cachedData;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private saveToCache(): void {
    localStorage.setItem(this.cacheKey, JSON.stringify(this.galleryImages));
    localStorage.setItem(this.cacheTimeKey, Date.now().toString());
  }

  /** ================== LOAD CSV ================== */
  private loadFromSheet(): void {
    this.http.get(this.gallerySheetUrl, { responseType: 'text' }).subscribe({
      next: csvData => {
        const rows = csvData.split('\n').slice(1); // skip header if present
        this.galleryImages = rows.map(r => this.commonService.convertDriveToThumbnail(r.trim())).filter(Boolean);
        this.saveToCache();
        this.loader.hide();
      },
      error: err => {
        console.error('Error loading gallery CSV:', err);
        this.loader.hide();
      }
    });
  }

}
