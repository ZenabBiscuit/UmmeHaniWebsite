import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';
import { FormsModule } from '@angular/forms';
import { CheckoutService } from '../../services/checkout.service';
import { LoaderService } from '../../services/loader.service';
import { Constants } from '../../app.constants';

interface Painting {
  Id: string;
  Title: string;
  Description: string;
  Image: string;
  Parts: string;           // semicolon-separated
  Price: string;           // semicolon-separated
  Medium: string;
  Size: string;
  MoreImages: string;      // semicolon-separated
  Stock: string;
}

@Component({
  selector: 'app-paintingdetail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './paintingdetail.component.html',
  styleUrls: ['./paintingdetail.component.scss']
})
export class PaintingDetailsComponent implements OnInit {
  painting: Painting | null = null;
  selectedImage: string | null = null;
  MoreImgs: string[] = [];

  parts: string[] = [];
  prices: string[] = [];
  descriptions: string[] = [];

  selectedPart: string | null = null;
  selectedPrice: string | null = null;
  selectedDescription: string | null = null;

  instagramId: string = '';

  private sheetUrl = Constants.SheetUrls.Paintings;
  private instaIdSheetUrl = Constants.SheetUrls.Admin;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private checkoutService: CheckoutService,
    private loader: LoaderService
  ) {}

  ngOnInit(): void {
    this.loader.show();
    const paintingId = this.route.snapshot.paramMap.get('id');

    // Load painting CSV
    this.http.get(this.sheetUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result: Papa.ParseResult<Painting>) => {
          const paintings = (result.data as Painting[]).map(row => this.trimObject(row));
          this.painting = paintings.find(p => p.Id === paintingId) || null;

          if (this.painting) {
            this.initPaintingDetails();
          }

          this.loader.hide();
        }
      });
    });

    // Load Instagram ID
    this.http.get(this.instaIdSheetUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const rows = result.data as any[];
          if (rows.length && rows[0]['InstaId']) {
            this.instagramId = rows[0]['InstaId'].trim();
          }
        }
      });
    });
  }

  /** Initialize painting details */
 private initPaintingDetails(): void {
  if (!this.painting) return;

  // Main image
  this.painting.Image = this.toThumbnail(this.painting.Image);
  this.selectedImage = this.painting.Image;

  // More images
  this.MoreImgs = this.painting.MoreImages
    ? this.painting.MoreImages.split(';').map(img => img.trim()).filter(Boolean).map(img => this.toThumbnail(img))
    : [];

  // Add the main image to the first position of MoreImgs
  this.MoreImgs.unshift(this.painting.Image);

  // Parse parts, prices, descriptions
  this.parts = this.painting.Parts ? this.painting.Parts.split(';').map(p => p.trim()).filter(Boolean) : [];
  
  // Only split price and description if there are parts
  if (this.parts.length > 0) {
    this.prices = this.painting.Price ? this.painting.Price.split(';').map(p => p.trim()) : [];
    this.descriptions = this.painting.Description ? this.painting.Description.split(';').map(d => d.trim()) : [];
  } else {
    // If no parts, use the whole price and description as single values
    this.prices = this.painting.Price ? [this.painting.Price.trim()] : [];
    this.descriptions = this.painting.Description ? [this.painting.Description.trim()] : [];
  }

  if (this.parts.length > 0) {
    // Multiple parts
    this.selectPart(0);
  } else {
    // Single item, no parts
    this.selectedPart = null;
    this.selectedPrice = this.prices.length > 0 ? this.prices[0] : '0';
    this.selectedDescription = this.descriptions.length > 0 ? this.descriptions[0] : '';
  }
}

  /** Trim all string values in object */
  private trimObject<T>(obj: T): T {
    const trimmed: any = {};
    Object.keys(obj as any).forEach(key => {
      const val = (obj as any)[key];
      trimmed[key] = typeof val === 'string' ? val.trim() : val;
    });
    return trimmed;
  }

  /** Convert Google Drive URL → thumbnail */
  private toThumbnail(url: string): string {
    if (!url) return '';
    const match = url.match(/\/d\/([^/]+)/);
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000` : url;
  }

  /** Change main image */
  changeImage(img: string): void {
    this.selectedImage = img;
  }

  /** Select a painting part */
  selectPart(index: number): void {
  if (!this.parts.length || index < 0 || index >= this.parts.length) return;

  this.selectedPart = this.parts[index];

  // Handle prices
  if (this.prices.length === 0) {
    this.selectedPrice = '0'; // fallback if no price
  } else if (this.prices.length === 1) {
    this.selectedPrice = this.prices[0]; // single price for all parts
  } else {
    this.selectedPrice = this.prices[index] || '0'; // match by index, fallback to 0
  }

  // Handle descriptions
  if (this.descriptions.length === 0) {
    this.selectedDescription = '';
  } else if (this.descriptions.length === 1) {
    this.selectedDescription = this.descriptions[0];
  } else {
    this.selectedDescription = this.descriptions[index] || '';
  }
}

  /** Checkout */
  checkOut(): void {
    if (!this.painting) return;

    const token = Math.random().toString(36).substring(2) + Date.now();
    const partTitle = this.selectedPart ? `${this.painting.Title} - ${this.selectedPart}` : this.painting.Title;

    const product = {
      productType: 'painting',
      Id: this.painting.Id,
      Title: partTitle,
      Description: this.selectedDescription,
      Image: this.painting.Image,
      Price: this.selectedPrice,
      Medium: this.painting.Medium,
      Size: this.painting.Size,
      MoreImages: this.painting.MoreImages,
      TotalPrice: this.selectedPrice || '0'
    };

    this.checkoutService.setCart(token, product);
    this.router.navigate(['/checkout'], { queryParams: { cartToken: token } });
  }

  get instaUrl(): string {
    return `https://instagram.com/${this.instagramId}`;
  }
}
