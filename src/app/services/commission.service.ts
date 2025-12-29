import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface CommissionRequest {
  id?: string;
  name: string;
  email: string;
  request: string;
  createdAt?: any;
  phone?: string;
}

@Injectable({ providedIn: 'root' })
export class CommissionService {
  constructor(private firestore: Firestore) {}

  getRequests(): Observable<CommissionRequest[]> {
    const commissionsRef = collection(this.firestore, 'commissionRequests');
    return collectionData(commissionsRef, { idField: 'id' }) as Observable<CommissionRequest[]>;
  }

  async deleteRequest(id: string) {
    const reqDoc = doc(this.firestore, `commissionRequests/${id}`);
    return deleteDoc(reqDoc);
  }
}
