import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';
import { RouterModule } from '@angular/router';
import { LoaderService } from '../../services/loader.service';
import { Constants } from '../../app.constants';
import { CommonService } from '../../services/common.service';

interface Painting {
  Id: string;
  Title: string;
  Description: string;
  Image: string;
  Price: string;
  Parts: string;
  Medium: string;
  Size: string;
  MoreImages?: string;
  Stock: string;

  displayPrice?: string; // ✅ computed price to show
}

@Component({
  selector: 'app-paintings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './paintings.component.html',
  styleUrls: ['./paintings.component.scss']
})
export class PaintingsComponent implements OnInit {
  availablePaintings: Painting[] = [];
  soldOutPaintings: Painting[] = [];

  private readonly sheetUrl = Constants.SheetUrls.Paintings;
  private readonly cacheKey = 'paintings_cache';
  private readonly cacheTimeKey = 'paintings_cache_time';
  private readonly cacheDuration = 30 * 60 * 1000; // 30 minutes in ms

  constructor(private http: HttpClient, private loader: LoaderService, private commonService: CommonService) {}

  ngOnInit(): void {
    this.loader.show();

    if (this.loadFromCache()) {
      this.computeDisplayPrices();
      // this.splitPaintings();
      this.loader.hide();
    } else {
      this.loadFromSheet();
    }
  }

  private loadFromCache(): boolean {
    const cachedTime = Number(localStorage.getItem(this.cacheTimeKey));
    if (!cachedTime || Date.now() - cachedTime > this.cacheDuration) return false;

    try {
      const cachedData = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
      if (Array.isArray(cachedData) && cachedData.length) {
        this.availablePaintings = cachedData;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private saveToCache(data: Painting[]): void {
    localStorage.setItem(this.cacheKey, JSON.stringify(data));
    localStorage.setItem(this.cacheTimeKey, Date.now().toString());
  }

  private loadFromSheet(): void {
    this.http.get(this.sheetUrl, { responseType: 'text' }).subscribe({
      next: csvData => {
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: (result: Papa.ParseResult<Painting>) => {
            const allPaintings: Painting[] = result.data.map(row => ({
              Id: row['Id']?.trim() || '',
              Title: row['Title']?.trim() || 'Untitled',
              Description: row['Description']?.trim() || '',
              Image: this.commonService.convertDriveToThumbnail(row['Image']?.trim() || ''),
              Price: row['Price']?.trim() || '',
              Parts: row['Parts']?.trim() || '',
              Medium: row['Medium']?.trim() || '',
              Size: row['Size']?.trim() || '',
              MoreImages: row['MoreImages']?.trim() || '',
              Stock: row['Stock']?.trim() || ''
            }));

            this.availablePaintings = allPaintings;
            this.computeDisplayPrices();
            // this.splitPaintings();
            this.saveToCache(allPaintings);
            this.loader.hide();
          }
        });
      },
      error: err => {
        console.error('Error loading paintings CSV:', err);
        this.loader.hide();
      }
    });
  }

  /** Compute displayPrice based on Parts or Price */
  private computeDisplayPrices(): void {
  this.availablePaintings.forEach(p => {
    // Combine Parts and Price columns into one array of price strings
    const priceStrings = ( p.Price || '').split(';').map(x => x.trim()).filter(Boolean);

    // Convert to numbers, removing commas
    const prices = priceStrings
      .map(x => Number(x.replace(/,/g, '')))
      .filter(x => !isNaN(x));


    if (prices.length === 0) {
      p.displayPrice = '';
    } else if (prices.every(price => price === prices[0])) {
      // All prices same
      p.displayPrice = `₹${prices[0].toLocaleString()}`;
    } else {
      // Different prices
      const minPrice = Math.min(...prices);
      p.displayPrice = `From ₹${minPrice.toLocaleString()}`;
    }
  });
}

  private splitPaintings(): void {
    const normalize = (s: string) => s.trim().toLowerCase();
    const allPaintings = this.availablePaintings;

    this.availablePaintings = allPaintings.filter(p => normalize(p.Stock) !== 'sold');
    this.soldOutPaintings = allPaintings.filter(p => normalize(p.Stock) === 'sold');
  }

}
