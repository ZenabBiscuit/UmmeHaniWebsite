import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as Papa from 'papaparse';
import { Constants } from '../../app.constants';

@Component({
  selector: 'app-confirmpayment',
  imports: [CommonModule, RouterModule],
  templateUrl: './confirmpayment.component.html',
  styleUrl: './confirmpayment.component.scss'
})
export class ConfirmpaymentComponent {
  orderId: string = '';
  instagramId: string = '';
  type: string = '';

  email: string = '';
  secretKey: string = '';
  recId: string = '';
  regData: any;

  recordings: any[] = [];

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) { }
  private instaIdSheetUrl = Constants.SheetUrls.Admin;

  ngOnInit(): void {
    // Get orderId from route
    this.route.queryParams.subscribe(params => {
      this.orderId = params['orderId'];
      this.type = params['type']

      const nav = this.router.getCurrentNavigation();
      if (nav?.extras.state && nav.extras.state['registrationData']) {
        this.regData = nav.extras.state['registrationData'];
        this.regData = JSON.parse(this.regData);
      }

      // Fallback to history.state (works after refresh)
      if (!this.regData && history.state['registrationData']) {
        this.regData = history.state['registrationData'];
        this.regData = JSON.parse(this.regData);
      }

      if (this.regData && this.type === 'recording') {
        this.email = this.regData.email;
        this.secretKey = this.regData.secretKey;
        this.recId = this.regData.recId;
      }

      if (this.type === 'bundle' && this.regData?.Recordings) {
        this.recordings = this.regData.Recordings;
      }



    });

    this.http.get(this.instaIdSheetUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const rows = result.data as any[];
          if (rows.length > 0 && rows[0]['InstaId']) {
            this.instagramId = rows[0]['InstaId'];
          }
        }
      });
    });
  }

  get instaUrl(): string {
    return `https://instagram.com/${this.instagramId}`;
  }

  getRecordingUrl() {
    return `/recordingaccess/${this.recId}`;
  }
}
