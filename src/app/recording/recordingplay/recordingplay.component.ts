import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Constants } from '../../app.constants';
import * as Papa from 'papaparse';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SafeUrlPipe } from '../../safe-url.pipe';


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
  selector: 'app-recordingplay',
  imports: [CommonModule, FormsModule, SafeUrlPipe],
  templateUrl: './recordingplay.component.html',
  styleUrls: ['./recordingplay.component.scss']
})
export class RecordingplayComponent implements OnInit {
  isMobile: boolean = window.innerWidth <=786;

  recId!: string;

  // popup form
  email = '';
  secretKey = '';
  showPopup = true;

  // recording data
  recording: any = null;
  errorMessage: string | null = null;

  private sheetUrl = Constants.SheetUrls.Recordings;

  constructor(private route: ActivatedRoute, private firestore: Firestore, private http: HttpClient) {}

  ngOnInit(): void {
    this.recId = this.route.snapshot.paramMap.get('id')!;

    this.http.get(this.sheetUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result: Papa.ParseResult<Recording>) => {
          const recordings = result.data as Recording[];
          this.recording = recordings.find(ws => ws.Id === this.recId) || null;
          if(this.recording){
          }
        }
      });
    });
  }

  getDriveDirectUrl(url: string): string {
    if (!url) return '';
    const match = url.match(/\/d\/([^/]+)\//);
    return match ? `https://drive.google.com/file/d/${match[1]}/preview` : url;
  }


  async verifyAccess() {
    this.errorMessage = '';
    try {
      const registrationsRef = collection(this.firestore, 'recordingregistrations');
      const q = query(
        registrationsRef,
        where('recId', '==', this.recId),
        where('email', '==', this.email),
        where('secretKey', '==', this.secretKey)
      );

      const snap = await getDocs(q);
      if (snap.empty) {
        this.errorMessage = 'Invalid details. Please try again.';
        return;
      }

      const regData = snap.docs[0].data() as any;

      // validate status and expiry
      const now = new Date();
      const endDate = new Date(regData.endDate);

      if (regData.status !== 'PaymentConfirmed') {
        this.errorMessage = 'Payment is not confirmed yet.';
        return;
      }
      if (now > endDate) {
        this.errorMessage = 'Your access to this recording has expired.';
        return;
      }


      this.showPopup = false;
      this.errorMessage = null;
    } catch (err) {
      console.error(err);
      this.errorMessage = 'Something went wrong. Please try again later.';
    }
  }
}
