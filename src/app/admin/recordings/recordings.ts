import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Recording, RecordingService } from '../../services/recordings.service';

@Component({
  selector: 'app-recordings',
  imports: [CommonModule, FormsModule],
  templateUrl: './recordings.html',
  styleUrl: './recordings.scss'
})
export class Recordings {
  recordings: Recording[] = [];
  loading = true;
  statuses = ['PaymentPending', 'PaymentConfirmed'];
  purchaseSearch: string = '';
  selectedPaymentStatus: string = ''
  

  // Store temporary selections before saving
  selectedStatuses: { [registrationId: string]: string } = {};
  
  // Store success and error messages
  successMessages: { [registrationId: string]: string } = {};
  errorMessages: { [registrationId: string]: string } = {};

  // Store success and error messages for email
  emailSuccessMessages: { [registrationId: string]: string } = {};
  emailErrorMessages: { [registrationId: string]: string } = {};


  // 🔹 New filter properties
  selectedRecId: string = '';
  allRecIds: string[] = [];
  
    constructor(private recService: RecordingService) {}
  
    ngOnInit() {
      this.recService.getOrders().subscribe(data => {
        this.recordings = data;
        this.loading = false;

        // Collect unique workshop titles
      this.allRecIds = Array.from(new Set(data.map(reg => reg.recId))).filter(Boolean);

        this.recordings.forEach(reg => {
          if (reg.id) {
            this.selectedStatuses[reg.id] = reg.status;
          }
        });
      });
    }

    get filteredRecordings(): Recording[] {
      let filtered = this.recordings;

      // Filter by selected workshop
      if (this.selectedRecId) {
        filtered = filtered.filter(reg => reg.recId === this.selectedRecId);
      }

      //Filter by payment status
      if(this.selectedPaymentStatus){
        filtered = filtered.filter(reg => reg.status === this.selectedPaymentStatus)
      }
          // Filter by purchase ID search
      if (this.purchaseSearch) {
        const searchLower = this.purchaseSearch.toLowerCase();
        filtered = filtered.filter(reg => reg.purchaseId.toLowerCase().includes(searchLower));
      }

      return filtered;
    }
  
    onStatusChange(reg: Recording, newStatus: string) {
      if (!reg.id) return;
      this.selectedStatuses[reg.id] = newStatus; // just store locally
    }
  
    saveStatus(reg: Recording) {
      if (!reg.id) return;
      const newStatus = this.selectedStatuses[reg.id];
  
      this.successMessages[reg.id] = '';
      this.errorMessages[reg.id] = '';
  
      this.recService.updateStatus(reg.id, newStatus)
        .then(() => {
          reg.status = newStatus; // keep UI in sync
          this.successMessages[String(reg.id)] = `Status updated to ${newStatus}`;
          setTimeout(() => this.successMessages[String(reg.id)] = '', 10000); // auto-clear
        })
        .catch(err => {
          console.error(err);
          this.errorMessages[String(reg.id)] = 'Failed to update status. Try again.';
      });
    }

     // ✅ NEW: Send Email method
  sendEmail(reg: Recording) {
    if (!reg.id) return;
    this.emailSuccessMessages[String(reg.id)] = '';
    this.emailErrorMessages[String(reg.id)] = '';

    this.recService.sendEmail(reg)
      .then(() => {
        reg.emailSent = true;
        this.emailSuccessMessages[String(reg.id)] = 'Email sent successfully!';
        setTimeout(() => this.emailSuccessMessages[String(reg.id)] = '', 3000);
      })
      .catch(() => {
        this.emailErrorMessages[String(reg.id)] = 'Failed to send email. Try again.';
      });
  }
}
