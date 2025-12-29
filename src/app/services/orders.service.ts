// order.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, query, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Order {
  id?: string;
  orderId: string;
  createdAt: any;
  email: string;
  status: string;
  
  address: {
    firstName: string;
    lastName: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    country: string;
    zip: string;
    phone: string;
  };
  product: {
    Id: string;
    Title: string;
    Description: string;
    Image: string;
    Medium: string;
    Size: string;
    Price: string
  };
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private firestore: Firestore) {}

  getOrders(): Observable<Order[]> {
    const ordersRef = collection(this.firestore, 'originalsOrders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Order[]>;
  }

  updateStatus(orderId: string, status: string) {
    const orderDoc = doc(this.firestore, `originalsOrders/${orderId}`);
    return updateDoc(orderDoc, { status });
  }

  getPrintsOrders(): Observable<Order[]> {
    const printsOrdersRef = collection(this.firestore, 'printsOrders');
    const q = query(printsOrdersRef, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Order[]>;
  }

  updatePrintsStatus(orderId: string, status: string) {
    const orderDoc = doc(this.firestore, `printsOrders/${orderId}`);
    return updateDoc(orderDoc, { status });
  }
}
