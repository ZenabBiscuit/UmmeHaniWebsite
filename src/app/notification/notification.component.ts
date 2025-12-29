import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';
import { Constants } from '../app.constants';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent {
  @Output() visibilityChange = new EventEmitter<boolean>();
  isVisible = true;
  notifContent: string = "";

  private notifUrl = Constants.SheetUrls.Notification;
  private readonly cacheKey = 'notification_cache';
  private readonly cacheTimeKey = 'notification_cache_time';
  private readonly cacheDuration = 1 * 1000; // 30 minutes

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (!this.loadFromCache()) {
      this.loadFromSheet();
    }
    // Emit initial visibility
    this.visibilityChange.emit(this.isVisible);
  }

  /** Close notification banner */
  closeBanner() {
    this.isVisible = false;
    this.visibilityChange.emit(this.isVisible);
  }

  /** Load notification from localStorage cache */
  private loadFromCache(): boolean {
    const cachedTime = Number(localStorage.getItem(this.cacheTimeKey));
    if (!cachedTime || Date.now() - cachedTime > this.cacheDuration) {
      return false; // cache expired
    }

    const cachedContent = localStorage.getItem(this.cacheKey);
    if (cachedContent) {
      this.notifContent = cachedContent;
      this.isVisible = true;
      return true;
    }

    return false;
  }

  /** Save notification content to cache */
  private saveToCache(content: string): void {
    localStorage.setItem(this.cacheKey, content);
    localStorage.setItem(this.cacheTimeKey, Date.now().toString());
  }

  /** Load notification from remote CSV */
  private loadFromSheet(): void {
    this.http.get(this.notifUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const rows = result.data as any[];
          if (rows.length > 0 && rows[0]['NotifContent']) {
            this.notifContent = rows[0]['NotifContent'];
            this.isVisible = true;
            this.saveToCache(this.notifContent);
          } else {
            this.isVisible = false;
          }
          this.visibilityChange.emit(this.isVisible);
        }
      });
    });
  }
}
