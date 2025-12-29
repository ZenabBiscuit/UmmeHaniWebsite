import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { addDoc, collection, Firestore, getDocs, limit, orderBy, query } from '@angular/fire/firestore';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Constants } from '../app.constants';
import * as Papa from 'papaparse';
import { HttpClient } from '@angular/common/http';
import { EmailService } from '../services/email.service';
import { CommonService } from '../services/common.service';

@Component({
  selector: 'app-contact',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  successMessage = '';
  errorMessage = '';
  emailForm: FormGroup;
  isSubmitting = false;
  instagramId: string = '';
  emailId: string = '';
  instaUrl: string = '';


  newsSubscribe = {
    userId: "",
    email: "",
    status: 'subscribed',
    createdAt: new Date()
  }


  private instaIdSheetUrl = Constants.SheetUrls.Admin;

  constructor(private fb: FormBuilder, private firestore: Firestore, private http: HttpClient, private emailService: EmailService, private commonService: CommonService) {
    this.emailForm = this.fb.group({
      email: ['', [
        Validators.required,
        this.noWhitespaceValidator,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]]
    }, { updateOn: 'change' });
  }

  ngOnInit(): void {
    this.http.get(this.instaIdSheetUrl, { responseType: 'text' }).subscribe(csvData => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const rows = result.data as any[];
          if (rows.length > 0) {
            this.instagramId = rows[0]['InstaId'];
            this.instaUrl = this.commonService.instaUrl(this.instagramId);
            this.emailId = rows[0]['EmailId']
          }
        }
      });
    });

  }

  // Custom validator
  noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    return !isWhitespace ? null : { whitespace: true };
  }



  async subscribeNewsletter() {

  this.successMessage = '';
  this.errorMessage = '';
  if (this.isSubmitting) return;
  this.isSubmitting = true;

  if (this.emailForm.invalid) {
    this.errorMessage = 'Please fill out email correctly.';
    this.isSubmitting = false;
    return;
  }

  const newsletterRef = collection(this.firestore, 'newsletters');

  // ✅ CHECK IF EMAIL ALREADY EXISTS
  const emailToCheck = this.emailForm.value.email.toLowerCase().trim();

  const checkQuery = query(
    newsletterRef,
    orderBy('email'),
    limit(1000) // limit required for orderBy
  );

  const snap = await getDocs(checkQuery);
  const existingUser = snap.docs.find(
  doc => (doc.data() as any)['email']?.toLowerCase() === emailToCheck
);


  if (existingUser) {
    this.errorMessage = 'You are already subscribed to our newsletter.';
    this.isSubmitting = false;
    this.emailForm.reset();
    return;
  }

  // ------------------------------------------
  // ✨ If not subscribed – continue as before
  // ------------------------------------------

  // Generate userId like USER0001
  const latestQuery = query(newsletterRef, orderBy('createdAt', 'desc'), limit(1));
  const latestSnap = await getDocs(latestQuery);
  let lastSubscriberNum = 0;

  if (!latestSnap.empty) {
    const latestOrder = latestSnap.docs[0].data() as any;
    const lastId = latestOrder.userId?.replace('USER', '') || '0';
    lastSubscriberNum = parseInt(lastId, 10);
  }

  const newUserId = `USER${(lastSubscriberNum + 1).toString().padStart(4, '0')}`;

  this.newsSubscribe = {
    userId: newUserId,
    email: emailToCheck,
    status: 'subscribed',
    createdAt: new Date()
  };

  await addDoc(newsletterRef, this.newsSubscribe);

  this.successMessage = 'Thank you! You have successfully subscribed to our newsletters.';
  this.isSubmitting = false;
  this.emailForm.reset();

  this.sendEmail(this.newsSubscribe);
}


  sendEmail(subscribedUser: any) {
      this.emailService.sendEmail(subscribedUser)
        .then(() => {
        })
        .catch(() => {
        });
    }
}
