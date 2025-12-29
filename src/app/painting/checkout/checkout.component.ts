import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CheckoutService } from '../../services/checkout.service';
import { CommonModule } from '@angular/common';
import { Firestore, collection, addDoc, getDocs, query, orderBy, limit } from '@angular/fire/firestore';
import * as countryTelephoneData from 'country-telephone-data';


@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent {
  cartToken: string = '';
  
  step = 1; // 1 = email step, 2 = address step
  emailForm: FormGroup;
  addressForm: FormGroup;
  product: any = null;

  

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

    
    this.emailForm = this.fb.group({
      email: ['', [
        Validators.required, 
        this.noWhitespaceValidator,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]]
    }, { updateOn: 'change' });

    this.addressForm = this.fb.group({
      firstName: ['', [Validators.required, this.noWhitespaceValidator]],
      lastName: ['', [Validators.required, this.noWhitespaceValidator]],
      address1: ['', [Validators.required, this.noWhitespaceValidator]],
      address2: [''],
      country: ['India', [Validators.required]],
      zip: ['', [Validators.required, this.noWhitespaceValidator]],
      city: ['', [Validators.required, this.noWhitespaceValidator]],
      state: ['', [Validators.required, this.noWhitespaceValidator]],
      countryCode: ['+91', [Validators.required]],  // ✅ added this
      phone: ['', [
        Validators.required,
        this.noWhitespaceValidator,
        Validators.pattern(/^[0-9]{6,12}$/) // ✅ allow 6–12 digits depending on country
      ]]
    }, { updateOn: 'change' });


    
    
  }

  countryCodes = countryTelephoneData.allCountries.map(c => {
      // Extract English name before any '(' character, and trim whitespace
      const englishName = c.name.split('(')[0].trim();
    
      return {
        name: englishName,
        dial_code: '+' + c.dialCode,
        code: c.iso2.toUpperCase(),
        flag: this.countryCodeToEmoji(c.iso2),
      };
    });

     countryCodeToEmoji(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, char => 
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}


  // Custom validator
  noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    return !isWhitespace ? null : { whitespace: true };
  }

  continueWithEmail() {
    if (this.emailForm.valid) {
      this.step = 2;
    }
  }

  async placeOrder() {
    if (!this.addressForm.valid) return;


    const formValues = this.addressForm.value;
  const fullPhone = `${formValues.countryCode}${formValues.phone}`;

    const orderData = {
      // orderId: newOrderId,
      email: this.emailForm.value.email,
      address: {
      ...formValues,
      phone: fullPhone  // ✅ store full number
    },
      product: this.product,
      status: 'PaymentPending',
      // createdAt: new Date()
    };

    // await addDoc(ordersRef, orderData);

    // ✅ Redirect to payment page
    this.router.navigate(['/payment'], {
      queryParams: {cartToken: this.cartToken},
      state: { 
        amount: this.product.Price, 
        orderData: JSON.stringify(orderData) }
    });

  }


}
