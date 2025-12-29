import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Constants } from '../../app.constants';
import { LoaderService } from '../../services/loader.service';
import { CommonService } from '../../services/common.service';

interface Collaboration {
  Id: string;
  Title: string;
  Description: string;
  Image: string;
  MoreImages?: string;
  CollaboratorInstagramId: string;
  InstaUrl: string;
}


@Component({
  selector: 'app-collaborations',
  imports: [CommonModule, RouterModule],
  templateUrl: './collaborations.component.html',
  styleUrl: './collaborations.component.scss'
})
export class CollaborationsComponent {
  collaborations: Collaboration[] = [];
  private readonly collaborationsSheetUrl = Constants.SheetUrls.Collaborations;
  private readonly cacheKey = 'collaborations_cache';
  private readonly cacheTimeKey = 'collaborations_cache_time';
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
        this.collaborations = cachedData;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private saveToCache(): void {
    localStorage.setItem(this.cacheKey, JSON.stringify(this.collaborations));
    localStorage.setItem(this.cacheTimeKey, Date.now().toString());
  }

  private loadFromSheet(): void {
    this.http.get(this.collaborationsSheetUrl, { responseType: 'text' }).subscribe({
         next: csvData => {
           Papa.parse(csvData, {
             header: true,
             skipEmptyLines: true,
             complete: (result: Papa.ParseResult<Collaboration>) => {
               this.collaborations = result.data.map(row => ({
                 Id: row['Id']?.trim() || '',
                 Title: row['Title']?.trim() || 'Untitled',
                 Description: row['Description']?.trim() || '',
                 Image: this.commonService.convertDriveToThumbnail(row['Image']?.trim() || ''),
                 CollaboratorInstagramId: row['CollaboratorInstagramId']?.trim() || '',
                 InstaUrl: this.commonService.instaUrl(row['CollaboratorInstagramId']?.trim() || ''),
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
