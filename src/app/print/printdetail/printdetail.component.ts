import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';
import { FormsModule } from '@angular/forms';
import { CheckoutService } from '../../services/checkout.service';
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
  MoreImages: string;
  Status: string;
}

interface Shipping {
  PaintingId: string;
  City: string;
  Charges: string;
}

@Component({
  selector: 'app-paintingdetail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './printdetail.component.html',
  styleUrls: ['./printdetail.component.scss']
})
export class PrintdetailComponent implements OnInit {
  shippings: Shipping[] = [];
  print: Print | null = null;

  selectedImage: string | null = null;
  MoreImgs: string[] = [];

  sizes: string[] = [];
  selectedSize: string | null = null;

  prices: string[] = [];
  selectedPrice: string = '';

  status: string[] = [];
  selectedStatus: string | null = null;

  private sheetUrl = Constants.SheetUrls.Prints;
  private shippingUrl = Constants.SheetUrls.Shipping;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private checkoutService: CheckoutService,
    private loader: LoaderService,
    private commonService: CommonService
  ) {}

  ngOnInit(): void {
    this.loader.show();
    let pendingCalls = 2;

    const markLoaded = () => {
      pendingCalls--;
      if (pendingCalls === 0) this.loader.hide();
    };

    const printId = this.route.snapshot.paramMap.get('id');

    /* ================= PRINT DATA ================= */
    this.http.get(this.sheetUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result: Papa.ParseResult<Print>) => {
          const prints = (result.data as Print[]).map(row => this.commonService.trimObject(row));
          this.print = prints.find(p => p.Id === printId) || null;

          if (this.print) {
            // ✅ Main image → thumbnail
            this.print.Image = this.commonService.convertDriveToThumbnail(this.print.Image);
            this.selectedImage = this.print.Image;

            // ✅ MoreImgs = [main image + extra images]
            this.MoreImgs = [
              this.print.Image,
              ...(this.print.MoreImages
                ? this.print.MoreImages
                    .split(';')
                    .map(img => img.trim())
                    .filter(Boolean)
                    .map(img => this.commonService.convertDriveToThumbnail(img))
                : [])
            ];

            // Sizes
            if (this.print.Size) {
              this.sizes = this.print.Size.split(';').map(s => s.trim()).filter(Boolean);
              this.selectedSize = this.sizes[0] || null;
            }

            // Prices
            if (this.print.Price) {
              this.prices = this.print.Price.split(';').map(p => p.trim()).filter(Boolean);
              this.selectedPrice = this.prices[0] || '';
            }

            // Status
            if (this.print.Status) {
              this.status = this.print.Status.split(';').map(s => s.trim()).filter(Boolean);
              this.selectedStatus = this.status[0] || null;
            }
          }

          markLoaded();
        }
      });
    });

    /* ================= SHIPPING DATA ================= */
    this.http.get(this.shippingUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result: Papa.ParseResult<Shipping>) => {
          this.shippings = result.data.map(row => ({
            PaintingId: row.PaintingId || '',
            City: row.City || '',
            Charges: row.Charges || ''
          }));
          markLoaded();
        }
      });
    });
  }


  /* ================= UI ================= */

  changeImage(img: string): void {
    this.selectedImage = img;
  }

  selectSize(index: number): void {
    this.selectedSize = this.sizes[index] || null;
    this.selectedPrice = this.prices[index] || '';
    this.selectedStatus = this.status[index] || null;
  }

  getCitiesForPainting(): Shipping[] {
    return this.shippings.filter(s => s.PaintingId === this.print?.Id);
  }

  /* ================= CHECKOUT ================= */

  checkOut(): void {
    if (!this.print) return;

    const token = Math.random().toString(36).substring(2) + Date.now();

    const product = {
      productType: 'print',
      Id: this.print.Id,
      Title: this.print.Title,
      Description: this.print.Description,
      Image: this.print.Image,
      Price: this.selectedPrice,
      Medium: this.print.Medium,
      Size: this.selectedSize || '',
      MoreImages: this.print.MoreImages
    };

    this.checkoutService.setCart(token, product);
    this.router.navigate(['/checkout'], { queryParams: { cartToken: token } });
  }
}
