import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';
import { LoaderService } from '../../services/loader.service';
import { Constants } from '../../app.constants';
import { CommonModule } from '@angular/common';
import { CheckoutService } from '../../services/checkout.service';
import { CommonService } from '../../services/common.service';

interface Recording {
  Id: string;
  Title: string;
  ThumbnailUrl: string;
  RecordingUrl: string;
  Price: string;
  AccessDays: string;
  Status: string;
}

interface RecordingBundle {
  BundleId: string;
  Title: string;
  Description: string;
  RecordingIds: string;
  DiscountPercent: string;
  OriginalPrice?: number;
  BundlePrice?: number;
  RecordingList?: Recording[];
  ThumbnailUrl: string;
  Status: string;
}

@Component({
  selector: 'app-recording-bundle',
  templateUrl: './recording-bundle.component.html',
  styleUrl: './recording-bundle.component.scss',
  imports: [CommonModule, RouterModule]
})
export class RecordingBundleComponent implements OnInit {

  bundleId: string = '';
  bundle: RecordingBundle | null = null;
  recordings: Recording[] = [];

  private bundleSheetUrl = Constants.SheetUrls.BundlePack;
  private recordingsSheetUrl = Constants.SheetUrls.Recordings;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private loader: LoaderService,
    private router: Router,
    private checkoutService: CheckoutService,
    private commonService: CommonService
  ) {}

  ngOnInit(): void {
    this.loader.show();
    this.bundleId = this.route.snapshot.paramMap.get('id') || '';

    // Load all recordings first
    this.http.get(this.recordingsSheetUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result: any) => {
          this.recordings = result.data.map((row: any) => ({
            Id: row['Id'] || '',
            Title: row['Title'] || 'Untitled',
            ThumbnailUrl: this.commonService.convertDriveToThumbnail(row['ThumbnailUrl'] || ''),
            RecordingUrl: row['RecordingUrl'] || '',
            AccessDays: row['AccessDays'] || 0 ,
            Price: row['Price'] || '0',
            Status: row['Status'] || ''
          }));
          this.loadBundle(); // after recordings loaded, load bundle details
        }
      });
    });
  }

  private loadBundle(): void {
    this.http.get(this.bundleSheetUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result: any) => {
          const found = result.data.find((row: any) => row['BundleId'] === this.bundleId);

          if (!found) {
            console.warn('Bundle not found');
            this.loader.hide();
            return;
          }

          const recordingIds = (found['RecordingIds'] || '')
            .split(',')
            .map((id: string) => id.trim());

          // Calculate original price
          const originalPrice = this.recordings
            .filter(r => recordingIds.includes(r.Id))
            .reduce((sum, r) => sum + Number(r.Price || 0), 0);

          const discount = Number(found['DiscountPercent'] || 0);
          const bundlePrice = Math.round(originalPrice - (originalPrice * discount) / 100);

          this.bundle = {
            BundleId: found['BundleId'],
            Title: found['Title'],
            Description: found['Description'],
            RecordingIds: found['RecordingIds'],
            DiscountPercent: found['DiscountPercent'],
            OriginalPrice: originalPrice,
            BundlePrice: bundlePrice,
            RecordingList: this.recordings.filter(r => recordingIds.includes(r.Id)),
            ThumbnailUrl: this.commonService.convertDriveToThumbnail(found['ThumbnailUrl']),
            Status: found['Status']
          };

          this.loader.hide();
        }
      });
    });
  }

  purchaseBundle(): void {
    if (!this.bundle || !this.bundle.RecordingList) return;

    // Create a cart token
    const cartToken = Math.random().toString(36).substr(2, 9);

     // Save the bundle in CheckoutService
  this.checkoutService.setCart(cartToken, {
    Id: this.bundle.BundleId,
    Title: this.bundle.Title,
    ThumbnailUrl: this.bundle.ThumbnailUrl,
    OriginalPrice: this.bundle.OriginalPrice,
    BundlePrice: this.bundle.BundlePrice,
    RecordingList: this.bundle.RecordingList || []
  });

    // Navigate to registration page
    this.router.navigate(['/bundleregistration'], { queryParams: { cartToken } });
  }
}