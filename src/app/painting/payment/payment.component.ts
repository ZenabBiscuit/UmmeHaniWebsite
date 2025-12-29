import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';
import * as Papa from 'papaparse';
import { HttpClient } from '@angular/common/http';
import { addDoc, collection, Firestore, getDocs, limit, orderBy, query } from '@angular/fire/firestore';
import { Constants } from '../../app.constants';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent {
  orderData = {
    orderId: "",
    email: "",
    address: null,
    product: null,
    status: 'PaymentPending',
    createdAt: new Date()
  }
  amount!: number;
  upiId: string = "";
  upiUrl: string = "";
  qrCodeUrl: string = "";
  ordData: any;
  isSubmitting = false;
  upiLinkClicked = false;

  private UpiSheetUrl = Constants.SheetUrls.Admin;

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router, private firestore: Firestore) {
    this.router.events.subscribe(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  ngOnInit(): void {
    const nav = history.state;  // <-- works even after reload
    if (nav && nav.amount) {
      this.amount = Number(
    nav.amount.toString().replace(/,/g, '')
  );
      this.ordData = JSON.parse(nav.orderData);
    } else {
      console.warn("No navigation state found!");
    }

    // Enable "I have paid" after 15s (assume they scanned)
    setTimeout(() => {
      this.upiLinkClicked = true;
    }, 15000);

    this.http.get(this.UpiSheetUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const rows = result.data as any[];
          if (rows.length > 0 && rows[0]['UPIId']) {
            this.upiId = rows[0]['UPIId'];
            this.upiUrl = `upi://pay?pa=${this.upiId}&pn=Umme%20Hani&am=${this.amount}&cu=INR`;
          }
        }
      });
    });
  }

  onUpiLinkClick() {
    this.upiLinkClicked = true;
  }

  async confirmPayment() {

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const productType = this.ordData.product.productType || 'unknown';
    if (productType === 'unknown') {
      console.error("Unknown product type in order data:", this.ordData);
      return;
    }
    if (productType === 'painting') {

      const ordersRef = collection(this.firestore, 'originalsOrders');
      // Generate orderId like UHO0001
      const latestQuery = query(ordersRef, orderBy('createdAt', 'desc'), limit(1));
      const latestSnap = await getDocs(latestQuery);
      let lastOrderNum = 0;

      if (!latestSnap.empty) {
        const latestOrder = latestSnap.docs[0].data() as any;
        const lastId = latestOrder.orderId?.replace('UHOR', '') || '1601';
        lastOrderNum = parseInt(lastId, 10);
      } else {
        // If no previous order, start at 1599 so first ID becomes 1600
        lastOrderNum = 1600;
      }

      const newOrderId = `UHOR${(lastOrderNum + 1).toString().padStart(4, '0')}`;


      this.orderData = {
        orderId: newOrderId,
        email: this.ordData.email,
        address: this.ordData.address,
        product: this.ordData.product,
        status: 'PaymentPending',
        createdAt: new Date()
      };


      await addDoc(ordersRef, this.orderData);

      this.router.navigate(['/payment-confirmation'], {
        queryParams: { type: 'originals', orderId: this.orderData.orderId }
      });
    }

    if (productType === 'print') {

      const ordersRef = collection(this.firestore, 'printsOrders');
      // Generate orderId like UHO0001
      const latestQuery = query(ordersRef, orderBy('createdAt', 'desc'), limit(1));
      const latestSnap = await getDocs(latestQuery);
      let lastOrderNum = 0;

      if (!latestSnap.empty) {
        const latestOrder = latestSnap.docs[0].data() as any;
        const lastId = latestOrder.orderId?.replace('UHPR', '') || '1601';
        lastOrderNum = parseInt(lastId, 10);
      } else {
        // If no previous order, start at 1600 so first ID becomes 1601
        lastOrderNum = 1600;
      }

      const newOrderId = `UHPR${(lastOrderNum + 1).toString().padStart(4, '0')}`;


      this.orderData = {
        orderId: newOrderId,
        email: this.ordData.email,
        address: this.ordData.address,
        product: this.ordData.product,
        status: 'PaymentPending',
        createdAt: new Date()
      };


      await addDoc(ordersRef, this.orderData);

      this.router.navigate(['/payment-confirmation'], {
        queryParams: { type: 'prints', orderId: this.orderData.orderId }
      });
    }


  }

}
