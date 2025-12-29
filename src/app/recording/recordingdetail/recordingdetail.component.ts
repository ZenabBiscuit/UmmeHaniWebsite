import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';
import { FormsModule } from '@angular/forms'; 
import { CheckoutService } from '../../services/checkout.service';
import { LoaderService } from '../../services/loader.service';
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
  selector: 'app-recordingdetail',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './recordingdetail.component.html',
  styleUrl: './recordingdetail.component.scss'
})


export class RecordingdetailComponent {
  recording: Recording | null = null;
  private sheetUrl = Constants.SheetUrls.Recordings;
  
  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router, private checkoutService: CheckoutService, private loader: LoaderService, private commonService: CommonService) {}

  ngOnInit(): void {

    this.loader.show();

    let pendingCalls = 1; // ✅ track number of async requests

    const markLoaded = () => {
      pendingCalls--;
      if (pendingCalls === 0) {
        this.loader.hide(); // hide loader when all done
      }
    };

    const recordingId = this.route.snapshot.paramMap.get('id');

    this.http.get(this.sheetUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result: Papa.ParseResult<Recording>) => {
          const recordings = result.data as Recording[];
          this.recording = recordings.find(ws => ws.Id === recordingId) || null;
          if(this.recording){
            this.recording.ThumbnailUrl = this.commonService.convertDriveToThumbnail(this.recording.ThumbnailUrl);
          }
        }
      });
      markLoaded();
    });

  }


  checkOut(){
    const token = Math.random().toString(36).substring(2) + Date.now(); // simple unique id
    interface Product {
      Id: string;
      Title: string;
      ThumbnailUrl: string;
      RecordingUrl: string;
      Price: number;
      AccessDays: number;
      Status: string;
    }


    var product: Product = {
      Id: this.recording?.Id || '',
      Title: this.recording?.Title || '',
      ThumbnailUrl: this.recording?.ThumbnailUrl || '',
      RecordingUrl: this.recording?.RecordingUrl || '',
      Price: parseInt(this.recording?.Price ?? '0') || 0,
      AccessDays: parseInt(this.recording?.AccessDays ?? '0') || 0,
      Status: this.recording?.Status || ''
    };

    this.checkoutService.setCart(token, product);
    this.router.navigate(['/recordingregistration'], { queryParams: { cartToken: token } });
  }
}
