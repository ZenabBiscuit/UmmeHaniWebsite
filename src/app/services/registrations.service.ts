// order.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Registration {
  id?: string;
  registrationId: string;
  createdAt: any;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  status: string;
  
  product: {
    Id: string;
    Title: string;
    Image: string;
    ModeSelected: string;
    Fees: number;
  };
}

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  constructor(private firestore: Firestore) {}

  getOrders(): Observable<Registration[]> {
    const ordersRef = collection(this.firestore, 'workshopregistrations');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Registration[]>;
  }

  updateStatus(registrationId: string, status: string) {
    const orderDoc = doc(this.firestore, `workshopregistrations/${registrationId}`);
    return updateDoc(orderDoc, { status });
  }
}
