import { Component, OnInit } from '@angular/core';
import { Review, ReviewService } from '../../services/reviews.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reviews',
  imports: [CommonModule],
  templateUrl: './reviews.html',
  styleUrl: './reviews.scss'
})
export class Reviews implements OnInit {

  reviews: Review[] = [];
  loading = true;

  constructor(private reviewService: ReviewService) {}

  ngOnInit() {
    this.reviewService.getReviews().subscribe(data => {
      this.reviews = data;
      this.loading = false;
    });
  }

  setStatus(review: Review, status: 'approved' | 'rejected') {
    if (!review.id) return;
    this.reviewService.updateStatus(review.id, status);
  }

  changeSort(review: Review, direction: 'up' | 'down') {
    if (!review.id) return;

    const currentIndex = this.reviews.findIndex(r => r.id === review.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= this.reviews.length) return;

    const targetReview = this.reviews[targetIndex];

    // Swap sortOrder values
    this.reviewService.updateSortOrder(review.id, targetReview.sortOrder);
    this.reviewService.updateSortOrder(targetReview.id!, review.sortOrder);
  }
}
