import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CheckoutService } from '../../services/checkout.service';
import { addDoc, collection, Firestore, getDocs, limit, orderBy, query } from '@angular/fire/firestore';
import * as countryTelephoneData from 'country-telephone-data';

@Component({
  selector: 'app-recregistration',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './recregistration.component.html',
  styleUrl: './recregistration.component.scss'
})
export class RecregistrationComponent {
  cartToken: string = '';
  emailForm: FormGroup;
  product: any = null;

  countryCodes = countryTelephoneData.allCountries.map(c => {
    const englishName = c.name.split('(')[0].trim();
    return {
      name: englishName,
      dial_code: '+' + c.dialCode,
      code: c.iso2.toUpperCase(),
      flag: this.countryCodeToEmoji(c.iso2),
    };
  });

  constructor(
    private route: ActivatedRoute,
    private checkoutService: CheckoutService,
    private fb: FormBuilder,
    private firestore: Firestore,
    private router: Router
  ) {
    this.route.queryParams.subscribe(params => {
      this.cartToken = params['cartToken'] || null;
      this.product = this.checkoutService.getCart(this.cartToken);
    });

    // UPDATED FORM
    this.emailForm = this.fb.group({
      firstName: ['', [Validators.required, this.noWhitespaceValidator]],
      lastName: ['', [Validators.required, this.noWhitespaceValidator]],
      email: ['', [
        Validators.required,
        this.noWhitespaceValidator,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
      countryCode: ['+91', Validators.required],
      phone: ['', [
        Validators.required,
        Validators.pattern(/^\d{6,14}$/)
      ]]
    });
  }

  noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    return !isWhitespace ? null : { whitespace: true };
  }

  countryCodeToEmoji(code: string) {
    return code
      .toUpperCase()
      .replace(/./g, char =>
        String.fromCodePoint(127397 + char.charCodeAt(0))
      );
  }

  calculateEndDate(purchaseDate: Date, accessDays: number): Date {
    const result = new Date(purchaseDate);
    result.setDate(result.getDate() + accessDays);
    return result;
  }

  async placeOrder() {
    if (!this.emailForm.valid) return;

    const secretAccessKey = Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('');

    const purchaseDateNow = new Date();
    const endDateNow = this.calculateEndDate(purchaseDateNow, this.product.AccessDays);

    const fullPhone = this.emailForm.value.countryCode + this.emailForm.value.phone;

    const recordingPurchaseData = {
      firstName: this.emailForm.value.firstName,
      lastName: this.emailForm.value.lastName,
      email: this.emailForm.value.email,
      phone: fullPhone,
      secretKey: secretAccessKey,
      recId: this.product.Id,
      purchaseDate: purchaseDateNow,
      accessDays: this.product.AccessDays,
      endDate: endDateNow,
      status: 'PaymentPending',
      Fee: this.product.Price,
      createdAt: new Date(),
      emailSent: false
    };

    this.router.navigate(['/registrationpayment'], {
      queryParams: { cartToken: this.cartToken, type: 'recording' },
      state: {
        amount: this.product.Price,
        registrationData: JSON.stringify(recordingPurchaseData)
      }
    });
  }
}
