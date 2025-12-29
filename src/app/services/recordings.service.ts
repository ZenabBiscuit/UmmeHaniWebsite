// order.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, query, orderBy } from '@angular/fire/firestore';
import { firstValueFrom, Observable } from 'rxjs';

export interface Recording {
  id?: string;
  purchaseId: string;
  recId: string;
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
  purchaseType: string;
}

@Injectable({ providedIn: 'root' })
export class RecordingService {

  private apiUrl = 'https://ummehaniwebsite.onrender.com/api/newsletter';

  constructor(private firestore: Firestore, private http: HttpClient) { }

  getOrders(): Observable<Recording[]> {
    const ordersRef = collection(this.firestore, 'recordingregistrations');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Recording[]>;
  }

  updateStatus(purchaseId: string, status: string) {
    const orderDoc = doc(this.firestore, `recordingregistrations/${purchaseId}`);
    return updateDoc(orderDoc, { status });
  }

  calculateEndDate(purchaseDate: Date, accessDays: number): Date {
    const result = new Date(purchaseDate);
    result.setDate(result.getDate() + accessDays);
    return result;
  }

  async sendEmail(record: Recording) {

    const orderDoc = doc(this.firestore, `recordingregistrations/${record.id}`);// 🔹 Update Firestore field

      const purchaseDateNow = new Date();
    const endDateNow = this.calculateEndDate(purchaseDateNow, record.accessDays);

      

    // Construct email subject and body
    const subject = `Access the Recording`;
    const emailBody = `
      <p>Hello,</p>
      <p>Thank you for your purchase!</p>
      <p>You can now access the recording by clicking the link below:</p>
      <p><a href="https://ummehani-arts.web.app/recordingaccess/${record.recId}" target="_blank">
        Access Your Recording
      </a></p>
      <p><strong>Secret Key:</strong> ${record.secretKey}</p>
      <p>You can access the recording until ${endDateNow.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }).replace(' at', ',')}</p>
      <br>
      <p>Warm regards,<br>Umme Hani</p>
    `;

    try {
      // 🔹 Trigger backend email API
      await firstValueFrom(
        this.http.post(this.apiUrl, {
          subject,
          html: emailBody,
          recipients: [record.email],
        })
      );
await updateDoc(orderDoc, { emailSent: true, purchaseDate:  purchaseDateNow.toISOString(), endDate: endDateNow.toISOString()});
    
    } catch (err) {
      throw err;
    }

  }
}
