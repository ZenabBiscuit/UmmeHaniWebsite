import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';
import { RouterModule } from '@angular/router';
import { LoaderService } from '../../services/loader.service';
import { Constants } from '../../app.constants';
import { CommonService } from '../../services/common.service';

interface Print {
  Id: string;
  Title: string;
  Description: string;
  Image: string;
  Price: string;
  Medium: string;
  Size: string;
  MoreImages?: string;
  Status: string;
}

@Component({
  selector: 'app-prints',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './prints.component.html',
  styleUrls: ['./prints.component.scss']
})
export class PrintsComponent implements OnInit {
  prints: Print[] = [];

  private readonly sheetUrl = Constants.SheetUrls.Prints;
  private readonly cacheKey = 'prints_cache';
  private readonly cacheTimeKey = 'prints_cache_time';
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
        this.prints = cachedData;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private saveToCache(): void {
    localStorage.setItem(this.cacheKey, JSON.stringify(this.prints));
    localStorage.setItem(this.cacheTimeKey, Date.now().toString());
  }

  /** ================== LOAD CSV ================== */
  private loadFromSheet(): void {
    this.http.get(this.sheetUrl, { responseType: 'text' }).subscribe({
      next: csvData => {
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: (result: Papa.ParseResult<Print>) => {
            this.prints = result.data.map(row => ({
              Id: row['Id']?.trim() || '',
              Title: row['Title']?.trim() || 'Untitled',
              Description: row['Description']?.trim() || '',
              Image: this.commonService.convertDriveToThumbnail(row['Image']?.trim() || ''),
              Price: row['Price']?.trim() || '',
              Medium: row['Medium']?.trim() || '',
              Size: row['Size']?.trim() || '',
              MoreImages: row['MoreImages']?.trim() || '',
              Status: row['Status']?.trim() || ''
            }));
            this.saveToCache();
            this.loader.hide();
          }
        });
      },
      error: err => {
        console.error('Error loading prints CSV:', err);
        this.loader.hide();
      }
    });
  }

}
