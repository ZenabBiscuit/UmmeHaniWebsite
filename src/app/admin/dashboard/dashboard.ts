import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard {
  subject = '';
  message = '';
  statusMsg = '';
  isError = false;
  isSending = false;
  selectAll = false;

  subscribers: { email: string, selected?: boolean }[] = [];

  // EmailJS keys
  serviceID = 'service_znmzwrr';
  templateID = 'template_36ozlnr';
  publicKey = 'yxdtMa--I2l3H8d_G';

  constructor(private http: HttpClient) {
    this.loadSubscribers();
  }

  async loadSubscribers() {
    try {
      const res: any = await this.http
        .get('https://firestore.googleapis.com/v1/projects/ummehani-arts/databases/(default)/documents/newsletters')
        .toPromise();

      this.subscribers = (res.documents || [])
        .map((doc: any) => doc.fields)
        .filter((fields: any) => fields.status.stringValue === 'subscribed')
        .map((fields: any) => ({ email: fields.email.stringValue, selected: false }));
    } catch (err) {
      console.error('Failed to load subscribers', err);
    }
  }

  selectedCount(): number {
    return this.subscribers.filter(sub => sub.selected).length;
  }

  toggleSelectAll() {
    this.subscribers.forEach(sub => sub.selected = this.selectAll);
  }


  async sendNewsletter() {
    const selectedSubscribers = this.subscribers.filter(sub => sub.selected).map(s => s.email);
    if (!this.subject || !this.message || selectedSubscribers.length === 0) return;

    this.isSending = true;
    this.statusMsg = '';
    this.isError = false;

    try {
      const htmlContent = `<p>${this.message.replace(/\n/g, '<br>')}</p>`;
      await this.http.post('https://ummehaniwebsite.onrender.com/api/newsletter', {
        subject: this.subject,
        html: htmlContent,            // use html for Brevo
        recipients: selectedSubscribers
      }).toPromise();
      console.log('Newsletter sent successfully');
      this.statusMsg = '✅ Newsletter sent successfully!';

      //reset all fields
      this.subject = '';
      this.message = '';
      this.selectAll = false;
      this.subscribers.forEach(s => s.selected = false);
    } catch (err) {
      console.error(err);
      console.log('Failed to send newsletter', err);
      this.statusMsg = '❌ Failed to send newsletter.';
      this.isError = true;
    } finally {
      this.isSending = false;
    }
  }
}
