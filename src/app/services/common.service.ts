

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CommonService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  convertDriveToThumbnail(url: string): string {
    if (!url) return '';
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
    return match && match[1]
      ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`
      : url;
  }

  instaUrl(instagramId: string): string {
    return `https://instagram.com/${instagramId}`;
  }

  trimObject<T>(obj: T): T {
    const trimmed: any = {};
    Object.keys(obj as any).forEach(key => {
      const val = (obj as any)[key];
      trimmed[key] = typeof val === 'string' ? val.trim() : val;
    });
    return trimmed;
  }
  
}
