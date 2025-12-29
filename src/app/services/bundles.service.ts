import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, query, orderBy, getDocs, limit, addDoc } from '@angular/fire/firestore';
import { firstValueFrom, Observable } from 'rxjs';
import { Recording, RecordingService } from './recordings.service';

export interface BundleRegistration {
  docId?: string;
  bundlePurchaseId?: string;  // Unique purchase ID
  bundleId: string;            // Bundle identifier
  bundleTitle: string;               // Bundle title
  Recordings: any[];  // Included recordings
  createdAt: any;
  email: string;
  status: string;
  purchaseDate: Date;
  endDate: Date;
  secretKey: string;
  accessDays: number;
  Fee: number;
  emailSent: boolean;
  firstName: string;
  lastName: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class BundleService {
  private apiUrl = 'https://ummehaniwebsite.onrender.com/api/newsletter';

  constructor(private firestore: Firestore, private http: HttpClient) {}

  getOrders(): Observable<BundleRegistration[]> {
    const ordersRef = collection(this.firestore, 'bundles');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<BundleRegistration[]>;
  }

  updateStatus(docId: string, status: string) {
    const orderDoc = doc(this.firestore, `bundles/${docId}`);
    return updateDoc(orderDoc, { status });
  }

  calculateEndDate(purchaseDate: Date, accessDays: number): Date {
    const result = new Date(purchaseDate);
    result.setDate(result.getDate() + accessDays);
    return result;
  }

  async sendEmail(bundle: BundleRegistration) {
  if (!bundle.docId) throw new Error('Invalid docId');

  const orderDoc = doc(this.firestore, `bundles/${bundle.docId}`);
  const purchaseDateNow = new Date();

  // Ensure each recording has its own endDate (from accessDays)
  const recordingsList = bundle.Recordings.map(r => {
    // If recording has its own accessDays, calculate endDate
    const recordingAccessDays = Number((r as any).AccessDays ?? bundle.accessDays ?? 0);
    const recordingEndDate = new Date(purchaseDateNow);
    recordingEndDate.setDate(recordingEndDate.getDate() + recordingAccessDays);
    return `
      <li>
        <strong>${r.Title}</strong> : 
        <a href="https://ummehani-arts.web.app/recordingaccess/${r.Id}" target="_blank">Click here to access the recording!</a>
        <br>
        (Access until: ${recordingEndDate.toLocaleString('en-GB', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).replace(' at', ',')})
      </li>
    `;
  }).join('');

  const subject = `Access Your Bundle: ${bundle.bundleTitle}`;
  const emailBody = `
    <p>Hello ${bundle.firstName},</p>
    <p>Thank you for your purchase of the bundle <strong>${bundle.bundleTitle}</strong>!</p>
    <p>You can access your recordings below:</p>
    <ul>${recordingsList}</ul>
    <p><strong>Secret Key:</strong> ${bundle.secretKey}</p>
    <br>
    <p>Warm regards,<br>Umme Hani</p>
  `;

  try {
    // Send email
    await firstValueFrom(this.http.post(this.apiUrl, {
      subject,
      html: emailBody,
      recipients: [bundle.email],
    }));

    // Update Firestore: save emailSent flag and purchaseDate
    await updateDoc(orderDoc, { 
      emailSent: true, 
      purchaseDate: purchaseDateNow.toISOString() 
      // No need to save endDate at bundle level since each recording has its own
    });

  } catch (err) {
    console.error('❌ Failed to send bundle email:', err);
    throw err;
  }
}

async addRecording(bundle: BundleRegistration){
const purchaseRef = collection(this.firestore, 'recordingregistrations');

for (const rec of bundle.Recordings) {
     // 🔹 SAFELY READ RECORDING DATA
    const recId = rec.Id ?? rec.Id;
    const accessDays = Number(rec.AccessDays ?? rec.accessDays ?? 0);
    const endDate = rec.endDate ?? rec.endDate;
      const latestQuery = query(purchaseRef, orderBy('createdAt', 'desc'), limit(1));
      const latestSnap = await getDocs(latestQuery);
      let lastRegistNum = 0;

      if (!latestSnap.empty) {
        const latestOrder = latestSnap.docs[0].data() as any;
        const lastId = latestOrder.purchaseId?.replace('UHREC', '') || '0';
        lastRegistNum = parseInt(lastId, 10);
      }
      const newRegId = `UHREC${(lastRegistNum + 1).toString().padStart(4, '0')}`;

      const purchaseData = {
        purchaseId: newRegId,
        firstName: bundle.firstName,
        lastName: bundle.lastName,
        phone: bundle.phone,
        email: bundle.email,
        secretKey: bundle.secretKey,
        recId: recId,
        purchaseDate: bundle.purchaseDate,
        accessDays: accessDays,
        endDate: endDate,
        status: 'PaymentConfirmed',
        fee: Number(rec.Price ?? 0),
        createdAt: new Date(),
        emailSent: true,
        purchaseType: 'Bundle'
      }

      await addDoc(purchaseRef, purchaseData);

};
     


}

}
