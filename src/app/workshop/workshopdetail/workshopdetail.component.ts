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
  Materials: string;
  Note: string;
  RecordingId: string;
  ShowRecording: string;
}



@Component({
  selector: 'app-workshopdetail',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './workshopdetail.component.html',
  styleUrl: './workshopdetail.component.scss'
})


export class WorkshopDetailComponent {
  workshop: Workshop | null = null;
  modes: string[] = [];
  selectedMode: string | null = null;
  prices: string[] = [];
  selectedPrice: string = ""
  notes: string = ""
  notesList: string[] = []
  

  private sheetUrl = Constants.SheetUrls.Workshops;
  
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

    const workshopId = this.route.snapshot.paramMap.get('id');

    this.http.get(this.sheetUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result: Papa.ParseResult<Workshop>) => {
          const workshops = result.data as Workshop[];
          this.workshop = workshops.find(ws => ws.Id === workshopId) || null;
          if(this.workshop){
            console.log(this.workshop);
            this.workshop.Image = this.commonService.convertDriveToThumbnail(this.workshop.Image);
            
            if(this.workshop.OnlineMode.toLowerCase()=='yes' && this.workshop.OfflineMode.toLowerCase()=='yes'){
              this.modes[0] = "Offline";
              this.prices[0] = this.workshop.RegistrationFeeOffline;
              this.modes[1] = "Online";
              this.prices[1] = this.workshop.RegistrationFeeOnline;
            }
            else if(this.workshop.OnlineMode.toLowerCase()=='no' && this.workshop.OfflineMode.toLowerCase()=='yes'){
              this.modes[0] = "Offline";
              this.prices[0] = this.workshop.RegistrationFeeOffline;
              
            }
            else if(this.workshop.OnlineMode.toLowerCase()=='yes' && this.workshop.OfflineMode.toLowerCase()=='no'){
              this.modes[0] = "Online";
              this.prices[0] = this.workshop.RegistrationFeeOnline;
              
            }
            

            // Convert semicolon-separated notes into array
            this.notes = this.workshop.Materials;
            if (this.notes) {
              this.notesList = this.notes.split(';').map(n => n.trim()).filter(n => n !== '');
            }

            //select first mode by default
            this.selectedMode = this.modes.length > 0 ? this.modes[0] : null;
            this.selectedPrice = this.prices.length > 0 ? this.prices[0] : "";

          }
        }
      });
      markLoaded();
    });

  }

  selectMode(index: number) {
    this.selectedMode = this.modes[index];
    this.selectedPrice = this.prices[index] || "0";
  }

  checkOut(){
    const token = Math.random().toString(36).substring(2) + Date.now(); // simple unique id
    interface Product {
      Id: string;
      Image: string;
      Title: string;
      ModeSelected: string;
      Fees: number;
    }

    var product: Product = {
      Id: this.workshop?.Id || '',
      Image: this.workshop?.Image || '',
      Title: this.workshop?.Title || '',
      ModeSelected: this.selectedMode || '',
      Fees: parseInt(this.selectedPrice) || 0
    };

    this.checkoutService.setCart(token, product);
    this.router.navigate(['/workshopregistration'], { queryParams: { cartToken: token } });
  }
}
