import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { LoaderService } from '../../services/loader.service';
import * as Papa from 'papaparse';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Constants } from '../../app.constants';
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


@Component({
  selector: 'app-recordings',
  imports: [CommonModule, RouterModule],
  templateUrl: './recordings.component.html',
  styleUrl: './recordings.component.scss'
})
export class RecordingsComponent {

  recordings: Recording[] = [];
  modes: string[] = [];

  private sheetUrl = Constants.SheetUrls.Recordings;
  
  constructor(private http: HttpClient, private loader: LoaderService, private commonService: CommonService) {
    this.loader.show();
  }

  ngOnInit(): void {
    this.loader.show();

    let pendingCalls = 1; // ✅ track number of async requests

    const markLoaded = () => {
      pendingCalls--;
      if (pendingCalls === 0) {
        this.loader.hide(); // hide loader when all done
      }
    };

    this.http.get(this.sheetUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true, // ✅ Use first row as keys
        skipEmptyLines: true,
        complete: (result: Papa.ParseResult<Recording>) => {
          this.recordings = result.data.map(row => ({
            Id: row['Id']?.trim() || '',
            Title: row['Title']?.trim() || 'Untitled',
            ThumbnailUrl: this.commonService.convertDriveToThumbnail(row['ThumbnailUrl']?.trim() || ''),
            RecordingUrl: row['RecordingUrl']?.trim() || '',
            Price: row['Price']?.trim() || '',
            AccessDays: row['AccessDays']?.trim() || '',
            Status: row['Status']?.trim() || ''
          }));
        }
      });
      markLoaded();
    });
  }

}
