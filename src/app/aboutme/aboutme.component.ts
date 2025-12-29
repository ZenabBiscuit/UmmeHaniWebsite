import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as Papa from 'papaparse';
import { LoaderService } from '../services/loader.service';
import { Constants } from '../app.constants';
import { CommonService } from '../services/common.service';

interface AboutSection {
  Title: string;
  Description: string;
}

@Component({
  selector: 'app-aboutme',
  imports: [CommonModule],
  templateUrl: './aboutme.component.html',
  styleUrls: ['./aboutme.component.scss']
})
export class AboutMeComponent implements OnInit {
  sections: AboutSection[] = [];
  profileImage: string | null = null;

  private sheetUrl = Constants.SheetUrls.AboutMe;
  private profileImageUrl = Constants.SheetUrls.Admin;

  private readonly cacheKey = 'aboutme_cache';
  private readonly cacheTimeKey = 'aboutme_cache_time';
  private readonly cacheDuration = 1 * 1000; // 30 minutes

  constructor(private http: HttpClient, private loader: LoaderService, private commonService: CommonService) {
    this.loader.show();
  }

  ngOnInit(): void {
    if (this.loadFromCache()) {
      this.loader.hide();
    } else {
      this.loadData();
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
        this.sections = cachedData.sections || [];
        this.profileImage = cachedData.profileImage || null;
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
        sections: this.sections,
        profileImage: this.profileImage
      })
    );
    localStorage.setItem(this.cacheTimeKey, Date.now().toString());
  }

  /** ================== LOAD DATA ================== */
  private loadData(): void {
    let pendingCalls = 2;

    const markLoaded = () => {
      pendingCalls--;
      if (pendingCalls === 0) {
        this.saveToCache();
        this.loader.hide();
      }
    };

    // Fetch About sections
    this.http.get(this.sheetUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result: Papa.ParseResult<AboutSection>) => {
          this.sections = result.data.map(row => ({
            Title: row['Title']?.trim() || '',
            Description: row['Description']?.trim() || ''
          }));
        }
      });
      markLoaded();
    });

    // Fetch profile image
    this.http.get(this.profileImageUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const rows = result.data as any[];
          if (rows.length > 0 && rows[0]['ProfilePicUrl']) {
            this.profileImage = this.commonService.convertDriveToThumbnail(rows[0]['ProfilePicUrl']);
          }
        }
      });
      markLoaded();
    });
  }

}
