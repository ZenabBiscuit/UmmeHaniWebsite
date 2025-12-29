import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';
import * as Papa from 'papaparse';
import { HttpClient } from '@angular/common/http';
import { addDoc, collection, Firestore, getDoc, getDocs, limit, orderBy, query } from '@angular/fire/firestore';
import { Constants } from '../../app.constants';
import { json } from 'node:stream/consumers';

@Component({
  selector: 'app-registrationpayment',
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './registrationpayment.component.html',
  styleUrl: './registrationpayment.component.scss'
})
export class RegistrationpaymentComponent {
  //workshop
  registrationData = {
    registrationId: "",
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    product: null,
    status: 'PaymentPending',
    createdAt: new Date()
  }

  //recording
  purchaseData = {
    purchaseId: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    secretKey: "",
    recId: "",
    purchaseDate: new Date(),
    accessDays: 0,
    endDate: new Date(),
    status: 'PaymentPending',
    fee: 0,
    createdAt: new Date(),
    emailSent: false,
    purchaseType: ""
  }

  amount!: number;
  registrationType!: string;
  upiId: string = "";
  upiUrl: string = "";
  qrCodeUrl: string = "";
  regData: any;
  isSubmitting = false;
  upiLinkClicked = false;

  private UpiSheetUrl = Constants.SheetUrls.Admin;

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router, private firestore: Firestore) {

    this.http.get(this.UpiSheetUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const rows = result.data as any[];
          if (rows.length > 0 && rows[0]['UPIId']) {
            this.upiId = rows[0]['UPIId'];

            // ✅ Build UPI URL
            this.upiUrl = `upi://pay?pa=${this.upiId}&pn=Umme%20Hani&am=${this.amount}&cu=INR`;

          }
        }
      });
    });

    this.route.queryParams.subscribe(params => {
      this.registrationType = params['type'] || '';

      const nav = this.router.getCurrentNavigation();
      if (nav?.extras.state) {
        this.amount = nav.extras.state['amount'];
        this.regData = nav.extras.state['registrationData'];
        this.regData = JSON.parse(this.regData);
      }


    });

    // Enable "I have paid" after 15s (assume they scanned)
  setTimeout(() => {
    this.upiLinkClicked = true;
  }, 15000);
  }

  onUpiLinkClick() {
    this.upiLinkClicked = true;
  }

  async confirmPayment() {

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    if (this.registrationType == 'workshop') {
      const registrationRef = collection(this.firestore, 'workshopregistrations');

      // Generate orderId like UHO0001
      const latestQuery = query(registrationRef, orderBy('createdAt', 'desc'), limit(1));
      const latestSnap = await getDocs(latestQuery);
      let lastRegistNum = 0;

      if (!latestSnap.empty) {
        const latestOrder = latestSnap.docs[0].data() as any;
        const lastId = latestOrder.registrationId?.replace('UHWS', '') || '0';
        lastRegistNum = parseInt(lastId, 10);
      }
      const newRegId = `UHWS${(lastRegistNum + 1).toString().padStart(4, '0')}`;

      this.registrationData = {
        registrationId: newRegId,
        email: this.regData.email,
        phone: this.regData.phone,
        firstName: this.regData.firstName,
        lastName: this.regData.lastName,
        product: this.regData.product,
        status: 'PaymentPending',
        createdAt: new Date()
      }

      await addDoc(registrationRef, this.registrationData);

      this.router.navigate(['/payment-confirmation'], {
        queryParams: { type: this.registrationType, orderId: this.registrationData.registrationId },
        state: {
          registrationData: JSON.stringify(this.registrationData)
        }
      });

    }

    else if (this.registrationType == 'recording') {
      const purchaseRef = collection(this.firestore, 'recordingregistrations');

      // Generate orderId like UHO0001
      const latestQuery = query(purchaseRef, orderBy('createdAt', 'desc'), limit(1));
      const latestSnap = await getDocs(latestQuery);
      let lastRegistNum = 0;

      if (!latestSnap.empty) {
        const latestOrder = latestSnap.docs[0].data() as any;
        const lastId = latestOrder.purchaseId?.replace('UHREC', '') || '0';
        lastRegistNum = parseInt(lastId, 10);
      }
      const newRegId = `UHREC${(lastRegistNum + 1).toString().padStart(4, '0')}`;


      this.purchaseData = {
        purchaseId: newRegId,
        firstName: this.regData.firstName,
        lastName: this.regData.lastName,
        phone: this.regData.phone,
        email: this.regData.email,
        secretKey: this.regData.secretKey,
        recId: this.regData.recId,
        purchaseDate: this.regData.purchaseDate,
        accessDays: this.regData.accessDays,
        endDate: this.regData.endDate,
        status: 'PaymentPending',
        fee: this.regData.Fee,
        createdAt: new Date(),
        emailSent: false,
        purchaseType: 'Individual'
      }

      await addDoc(purchaseRef, this.purchaseData);


      this.router.navigate(['/payment-confirmation'], {
        queryParams: { type: this.registrationType, orderId: this.purchaseData.purchaseId },
        state: {
          registrationData: JSON.stringify(this.purchaseData)
        }
      });

    }

    else if (this.registrationType === 'bundle') {
  const bundleRef = collection(this.firestore, 'bundles');

  // Generate new bundle purchase ID like UHBU0001
  const latestQuery = query(bundleRef, orderBy('createdAt', 'desc'), limit(1));
  const latestSnap = await getDocs(latestQuery);
  let lastBundleNum = 0;

  if (!latestSnap.empty) {
    const latestBundle = latestSnap.docs[0].data() as any;
    const lastId = latestBundle.bundlePurchaseId?.replace('UHBU', '') || '0';
    lastBundleNum = parseInt(lastId, 10);
  }

  const newBundleId = `UHBU${(lastBundleNum + 1).toString().padStart(4, '0')}`;

   const purchaseDate = new Date();
   
  const recordingsWithEndDate = this.regData.Recordings?.map((rec: any) => {
    const endDate = new Date(purchaseDate);
    const accessDaysNum = Number(rec.AccessDays) || 0;
    endDate.setDate(endDate.getDate() + (accessDaysNum || 0));
    return {
      ...rec,
      endDate: endDate.toISOString(),
      purchaseDate: purchaseDate.toISOString()
    };
  }) || [];

  const bundlePurchaseData = {
    ...this.regData, // contains everything from bundle registration
    bundlePurchaseId: newBundleId,
    createdAt: new Date(),
    status: 'PaymentPending',
    Recordings: recordingsWithEndDate
  };

  await addDoc(bundleRef, bundlePurchaseData);

  this.router.navigate(['/payment-confirmation'], {
    queryParams: { type: this.registrationType, orderId: newBundleId },
    state: { registrationData: JSON.stringify(bundlePurchaseData) }
  });
}

  }
}
