// review.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, orderBy, query, where } from '@angular/fire/firestore';
import { Observable, of, tap } from 'rxjs';

export interface Review {
  id?: string;
  name: string;
  city: string;
  review: string;
  status: 'pending' | 'approved' | 'rejected';
  createdDate: any;
  sortOrder: number;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private cachedReviews: any[] = [];
  constructor(private firestore: Firestore) {}

  getReviews(): Observable<Review[]> {
    const reviewsRef = collection(this.firestore, 'reviews');
    const q = query(reviewsRef, orderBy('sortOrder', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Review[]>;
  }

  updateStatus(reviewId: string, status: 'approved' | 'rejected') {
    const reviewDoc = doc(this.firestore, `reviews/${reviewId}`);
    return updateDoc(reviewDoc, { status });
  }

  updateSortOrder(reviewId: string, sortOrder: number) {
    const reviewDoc = doc(this.firestore, `reviews/${reviewId}`);
    return updateDoc(reviewDoc, { sortOrder });
  }

  getApprovedReviews() {
    if (this.cachedReviews.length > 0) {
      return of(this.cachedReviews); // return cached
    }
    const reviewsRef = collection(this.firestore, 'reviews');
    
    const q = query(
      reviewsRef,
      where('status', '==', 'approved'),
      orderBy('sortOrder')
    );

    return collectionData(q, { idField: 'id' }).pipe(
      tap(data => this.cachedReviews = data)
    );
  }
}
