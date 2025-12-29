import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import * as countryTelephoneData from 'country-telephone-data';
import { RouterModule } from '@angular/router';
import { Constants } from '../app.constants';
import { HttpClient } from '@angular/common/http';
import * as Papa from 'papaparse';

interface FAQSection{
  Question: string;
  Answer: string;
}

@Component({
  selector: 'app-commissions',
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './commissions.component.html',
  styleUrls: ['./commissions.component.scss']
})
export class CommissionsComponent {
  commissionForm: FormGroup;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  sections: FAQSection[] = [];

  private faqsheetUrl = Constants.SheetUrls.FAQ;

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
  

  constructor(private fb: FormBuilder, private firestore: Firestore, private http: HttpClient) {
    this.commissionForm = this.fb.group({
      name: ['', [Validators.required, this.noWhitespaceValidator]],
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      request: ['', [Validators.required, this.noWhitespaceValidator]],
      countryCode: ['+91', Validators.required],  // default India code
      phone: ['', [
        Validators.required,
        this.noWhitespaceValidator,
        Validators.pattern(/^\d{6,14}$/)// ✅ Indian phone numbers (10 digits, starts with 6-9)
      ]]
    });

    
  }

  ngOnInit(): void {
    this.http.get(this.faqsheetUrl, { responseType: 'text' }).subscribe(csvData => {
          Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (result: Papa.ParseResult<FAQSection>) => {
              this.sections = result.data.map(row => ({
                Question: row['Question']?.trim() || '',
                Answer: row['Answer']?.trim() || ''
              }));
            }
          });
    
        });
  }

  noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  }

  
  countryCodeToEmoji(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, char => 
      String.fromCodePoint(127397 + char.charCodeAt(0))
    );
}

  async submitCommission() {
    this.successMessage = '';
    this.errorMessage = '';

    if (this.commissionForm.invalid) {
      this.errorMessage = 'Please fill out all fields correctly.';
      return;
    }

    this.submitting = true;
    const { name, email, request, countryCode, phone } = this.commissionForm.value;

    const fullPhone = countryCode + phone;
    
    try {
      const col = collection(this.firestore, 'commissionRequests');
      await addDoc(col, {
        name: name,
        email: email.trim(),
        phone: fullPhone.trim(),
        request: request.trim(),
        createdAt: serverTimestamp()
      });

      this.successMessage = 'Thank you! Your request has been submitted.';
      this.commissionForm.reset();
    } catch (err) {
      console.error(err);
      this.errorMessage = 'Something went wrong. Please try again later.';
    } finally {
      this.submitting = false;
    }
  }
}
