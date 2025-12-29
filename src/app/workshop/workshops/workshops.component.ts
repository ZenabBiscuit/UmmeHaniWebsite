import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { LoaderService } from '../../services/loader.service';
import * as Papa from 'papaparse';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Constants } from '../../app.constants';
import { CommonService } from '../../services/common.service';

interface Workshop {
  Id: string;
  Title: string;
  Description: string;
  Image: string;
  Date: string;
  Time: string;
  Venue: string;
  RegistrationFeeOnline: string;
  RegistrationFeeOffline: string;
  OnlineMode: string;
  OfflineMode: string;
  Status: string;
  Note: string;
}

interface Recording {
  Id: string;
  Title: string;
  Price: string;
  Status: string;
}

interface RecordingBundle {
  BundleId: string;
  Title: string;
  Description: string;
  RecordingIds: string;
  DiscountPercent: string;
  AccessDays: string;
  ThumbnailUrl: string;
  Status: string;

  // calculated
  OriginalPrice?: number;
  BundlePrice?: number;
  RecordingIdList?: string[];
}

type GridItem =
  | { type: 'bundle'; data: RecordingBundle }
  | { type: 'workshop'; data: Workshop };

@Component({
  selector: 'app-workshops',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './workshops.component.html',
  styleUrls: ['./workshops.component.scss']
})
export class WorkshopsComponent implements OnInit {

  workshops: Workshop[] = [];
  recordings: Recording[] = [];
  bundles: RecordingBundle[] = [];
  gridItems: GridItem[] = [];

  private readonly cacheKey = 'workshops_cache';
  private readonly cacheTimeKey = 'workshops_cache_time';
  private readonly cacheDuration = 1 * 1000; // 30 minutes

  private readonly sheetUrls = {
    workshops: Constants.SheetUrls.Workshops,
    recordings: Constants.SheetUrls.Recordings,
    bundles: Constants.SheetUrls.BundlePack
  };

  constructor(private http: HttpClient, private loader: LoaderService, private commonService: CommonService) {
    this.loader.show();
  }

  ngOnInit(): void {
    if (this.loadFromCache()) {
      this.buildGrid();
      this.loader.hide();
    } else {
      this.loadAllSheets();
    }
  }

  /** ================== CACHE ================== */
  private loadFromCache(): boolean {
    const cachedTime = Number(localStorage.getItem(this.cacheTimeKey));
    if (!cachedTime || Date.now() - cachedTime > this.cacheDuration) {
      return false;
    }

    try {
      const cachedData = JSON.parse(localStorage.getItem(this.cacheKey) || '{}');
      if (cachedData) {
        this.workshops = cachedData.workshops || [];
        this.recordings = cachedData.recordings || [];
        this.bundles = cachedData.bundles || [];
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private saveToCache(): void {
    localStorage.setItem(
      this.cacheKey,
      JSON.stringify({
        workshops: this.workshops,
        recordings: this.recordings,
        bundles: this.bundles
      })
    );
    localStorage.setItem(this.cacheTimeKey, Date.now().toString());
  }

  /** ================== LOAD SHEETS ================== */
  private loadAllSheets(): void {
    let pendingCalls = 3;

    const markLoaded = () => {
      pendingCalls--;
      if (pendingCalls === 0) {
        this.buildGrid();
        this.saveToCache();
        this.loader.hide();
      }
    };

    // Workshops
    this.http.get(this.sheetUrls.workshops, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result: Papa.ParseResult<Workshop>) => {
          this.workshops = result.data.map(row => ({
            Id: row['Id']?.trim() || '',
            Title: row['Title']?.trim() || 'Untitled',
            Description: row['Description']?.trim() || '',
            Image: this.commonService.convertDriveToThumbnail(row['Image']?.trim() || ''),
            Date: row['Date']?.trim() || '',
            Time: row['Time']?.trim() || '',
            Venue: row['Venue']?.trim() || '',
            RegistrationFeeOnline: row['RegistrationFeeOnline']?.trim() || '',
            RegistrationFeeOffline: row['RegistrationFeeOffline']?.trim() || '',
            OnlineMode: row['OnlineMode']?.trim() || '',
            OfflineMode: row['OfflineMode']?.trim() || '',
            Status: row['Status']?.trim() || '',
            Note: row['Note']?.trim() || ''
          }));
        }
      });
      markLoaded();
    });

    // Recordings
    this.http.get(this.sheetUrls.recordings, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result: Papa.ParseResult<Recording>) => {
          this.recordings = result.data.map(row => ({
            Id: row['Id']?.trim() || '',
            Title: row['Title']?.trim() || '',
            Price: row['Price']?.trim() || '0',
            Status: row['Status']?.trim() || ''
          }));
        }
      });
      markLoaded();
    });

    // Bundles
    this.http.get(this.sheetUrls.bundles, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result: Papa.ParseResult<RecordingBundle>) => {
          this.bundles = result.data.map(row => ({
            BundleId: row['BundleId']?.trim() || '',
            Title: row['Title']?.trim() || '',
            Description: row['Description']?.trim() || '',
            RecordingIds: row['RecordingIds']?.trim() || '',
            DiscountPercent: row['DiscountPercent']?.trim() || '0',
            AccessDays: row['AccessDays']?.trim() || '',
            ThumbnailUrl: this.commonService.convertDriveToThumbnail(row['ThumbnailUrl']?.trim() || ''),
            Status: row['Status']?.trim() || ''
          }));
        }
      });
      markLoaded();
    });
  }

  /** ================== BUILD GRID ================== */
  private buildGrid() {
    this.gridItems = [];

    // 👉 Add active bundle first
    const activeBundle = this.bundles.find(b => b.Status.toLowerCase() === 'active');
    if (activeBundle) {
      const ids = activeBundle.RecordingIds.split(',').map(x => x.trim());
      const discount = Number(activeBundle.DiscountPercent);

      const originalPrice = this.recordings
        .filter(r => ids.includes(r.Id))
        .reduce((sum, r) => sum + Number(r.Price), 0);

      const discountedPrice = Math.round(originalPrice - (originalPrice * discount) / 100);

      activeBundle.RecordingIdList = ids;
      activeBundle.OriginalPrice = originalPrice;
      activeBundle.BundlePrice = discountedPrice;

      this.gridItems.push({ type: 'bundle', data: activeBundle });
    }

    // 👉 Add workshops
    this.workshops.forEach(w => this.gridItems.push({ type: 'workshop', data: w }));
  }
}
