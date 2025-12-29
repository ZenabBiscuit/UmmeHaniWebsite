import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import * as countryTelephoneData from 'country-telephone-data';
import { CheckoutService } from '../../services/checkout.service';

@Component({
  selector: 'app-bundleregistration',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './bundleregistration.component.html',
  styleUrl: './bundleregistration.component.scss'
})
export class BundleregistrationComponent {
  cartToken: string = '';
  emailForm: FormGroup;
  bundle: any = null;
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
    private fb: FormBuilder,
    private checkoutService: CheckoutService,
    private router: Router
  ) {
    this.route.queryParams.subscribe(params => {
      this.cartToken = params['cartToken'] || '';
      this.bundle = this.checkoutService.getCart(this.cartToken);
    });

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
      .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
  }

  calculateEndDate(purchaseDate: Date, accessDays: number): Date {
    const result = new Date(purchaseDate);
    result.setDate(result.getDate() + accessDays);
    return result;
  }

  placeOrder() {
    if (!this.emailForm.valid || !this.bundle) return;

    const secretAccessKey = Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('');
    const purchaseDateNow = new Date();

    const fullPhone = this.emailForm.value.countryCode + this.emailForm.value.phone;

    const bundlePurchaseData = {
      firstName: this.emailForm.value.firstName,
      lastName: this.emailForm.value.lastName,
      email: this.emailForm.value.email,
      phone: fullPhone,
      secretKey: secretAccessKey,
      bundleId: this.bundle.Id,
      bundleTitle: this.bundle.Title,
      purchaseDate: purchaseDateNow,
      status: 'PaymentPending',
      Fee: this.bundle.BundlePrice,
      Recordings: this.bundle.RecordingList || [],
      createdAt: new Date(),
      emailSent: false
    };


    // Navigate to payment page
    this.router.navigate(['/registrationpayment'], {
      queryParams: { cartToken: this.cartToken, type: 'bundle' },
      state: {
        amount: this.bundle.BundlePrice,
        registrationData: JSON.stringify(bundlePurchaseData)
      }
    });
  }
}
