import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CheckoutService } from '../../services/checkout.service';
import { addDoc, collection, Firestore, getDocs, limit, orderBy, query } from '@angular/fire/firestore';
import * as countryTelephoneData from 'country-telephone-data';

@Component({
  selector: 'app-wsregistration',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './wsregistration.component.html',
  styleUrl: './wsregistration.component.scss'
})
export class WsregistrationComponent {
  cartToken: string = '';
  
  step = 1; // 1 = email step, 2 = address step
  emailForm: FormGroup;
  addressForm: FormGroup;
  product: any = null;

  


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
      countryCode: ['+91', Validators.required],  // default India code
      phone: ['', [
        Validators.required,
        this.noWhitespaceValidator,
        Validators.pattern(/^\d{6,14}$/)// ✅ Indian phone numbers (10 digits, starts with 6-9)
      ]]
    }, { updateOn: 'change' });
  }

  countryCodeToEmoji(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, char => 
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}


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

    // const registrationRef = collection(this.firestore, 'workshopregistrations');

    // // Generate orderId like UHO0001
    // const latestQuery = query(registrationRef, orderBy('createdAt', 'desc'), limit(1));
    // const latestSnap = await getDocs(latestQuery);
    // let lastRegistNum = 0;

    // if (!latestSnap.empty) {
    //   const latestOrder = latestSnap.docs[0].data() as any;
    //   const lastId = latestOrder.registrationId?.replace('UHWS', '') || '0';
    //   lastRegistNum = parseInt(lastId, 10);
    // }
    // const newRegId = `UHWS${(lastRegistNum + 1).toString().padStart(4, '0')}`;

    const fullPhone = this.addressForm.value.countryCode + this.addressForm.value.phone;
    const registrationData = {
      email: this.emailForm.value.email,
      phone: fullPhone,
      firstName: this.addressForm.value.firstName,
      lastName: this.addressForm.value.lastName,
      product: this.product,
      status: 'PaymentPending'
    };

    // await addDoc(registrationRef, registrationData);

    // ✅ Redirect to payment page
    this.router.navigate(['/registrationpayment'], {
      queryParams: {cartToken: this.cartToken, type: 'workshop'},
      state: { 
        amount: this.product.Fees,
        registrationData: JSON.stringify(registrationData)
      }
    });

  }



}
