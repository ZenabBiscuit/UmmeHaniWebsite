// order.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class EmailService {

    private apiUrl = 'https://ummehaniwebsite.onrender.com/api/newsletter';

    constructor(private http: HttpClient) { }


    async sendEmail(record: any) {

        // Construct email subject and body
        const subject = `Welcome to the community!`;
        const emailBody = `
<p>Hello,</p>
<p>Thank you for subscribing to our newsletter!</p>
<p>You’re now part of our community, and we’re excited to have you here.</p>
<p>Here’s what you can expect:</p>
<ul>
  <li>Updates on new artwork, workshops, and releases</li>
  <li>Behind-the-scenes stories and creative insights</li>
  <li>Early access to limited drops and special announcements</li>
</ul>

<p>Stay tuned. We’ll be in touch soon!</p>

<br>

<p>Warm regards,<br>Umme Hani</p>

    `;

        try {
            // 🔹 Trigger backend email API
            await firstValueFrom(
                this.http.post(this.apiUrl, {
                    subject,
                    html: emailBody,
                    recipients: [record.email],
                })
            );

        } catch (err) {
            console.error('❌ Failed to send recording email:', err);
            throw err;
        }

    }
}
