import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

@Component({
  selector: 'app-reviews',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.scss'
})
export class ReviewsComponent {

  name = '';
  city = '';
  review = '';
  successMessage = '';
  errorMessage = '';
  isSubmitting = false;
  reviewForm: FormGroup

  constructor(private firestore: Firestore, private fb: FormBuilder) {

    this.reviewForm = this.fb.group({
      name: ['', [Validators.required, this.noWhitespaceValidator]],
      city: ['', [Validators.required, this.noWhitespaceValidator]],
      review: ['', [Validators.required, this.noWhitespaceValidator]]
    }, { updateOn: 'change' });
  }

  // Custom validator
  noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    return !isWhitespace ? null : { whitespace: true };
  }

  async submitReview() {
    this.successMessage = '';
    this.errorMessage = '';
    if (!this.reviewForm.value.name.trim() || !this.reviewForm.value.review.trim()) {
      this.errorMessage = 'Please fill out all fields.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const reviewsRef = collection(this.firestore, 'reviews');
      await addDoc(reviewsRef, {
        name: this.reviewForm.value.name,
        city: this.reviewForm.value.city,
        review: this.reviewForm.value.review,
        createdDate: serverTimestamp(),
        status: 'pending',
        sortOrder: Date.now()  // ✅ default order
      });

      this.successMessage = 'Thank you for the feedback!';
      this.reviewForm.value.name = '';
      this.reviewForm.value.review = '';
      this.reviewForm.reset();
    } catch (err) {
      console.error(err);
      this.errorMessage = 'Something went wrong. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

}
