import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Registration, RegistrationService } from '../../services/registrations.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-registrations',
  imports: [CommonModule, FormsModule],
  templateUrl: './registrations.html',
  styleUrl: './registrations.scss'
})
export class Registrations {
  registrations: Registration[] = [];
  loading = true;
  statuses = ['PaymentPending', 'PaymentConfirmed'];
  purchaseSearch: string = '';
  selectedPaymentStatus: string = '';
  

  // Store temporary selections before saving
  selectedStatuses: { [registrationId: string]: string } = {};
  
  // Store success and error messages
  successMessages: { [registrationId: string]: string } = {};
  errorMessages: { [registrationId: string]: string } = {};

  // 🔹 New filter properties
  selectedWorkshop: string = '';
  workshopTitles: string[] = [];
  
    constructor(private registrationService: RegistrationService) {}
  
    ngOnInit() {
      this.registrationService.getOrders().subscribe(data => {
        this.registrations = data;
        this.loading = false;

        // Collect unique workshop titles
      this.workshopTitles = Array.from(new Set(data.map(reg => reg.product?.Title))).filter(Boolean);

        this.registrations.forEach(reg => {
          if (reg.id) {
            this.selectedStatuses[reg.id] = reg.status;
          }
        });
      });
    }

    get filteredRegistrations(): Registration[] {
      let filtered = this.registrations;

      if(this.selectedWorkshop){
        filtered = filtered.filter(reg => reg.product?.Title === this.selectedWorkshop);
      }

      if(this.selectedPaymentStatus){
        filtered = filtered.filter(reg => reg.status === this.selectedPaymentStatus)
      }
      
      if (this.purchaseSearch) {
        const searchLower = this.purchaseSearch.toLowerCase();
        filtered = filtered.filter(reg => reg.registrationId.toLowerCase().includes(searchLower));
      }

      return filtered;
    }
  
    onStatusChange(reg: Registration, newStatus: string) {
      if (!reg.id) return;
      this.selectedStatuses[reg.id] = newStatus; // just store locally
    }
  
    saveStatus(reg: Registration) {
      if (!reg.id) return;
      const newStatus = this.selectedStatuses[reg.id];
  
      this.successMessages[reg.id] = '';
      this.errorMessages[reg.id] = '';
  
      this.registrationService.updateStatus(reg.id, newStatus)
        .then(() => {
          reg.status = newStatus; // keep UI in sync
          this.successMessages[String(reg.id)] = `Status updated to ${newStatus}`;
          setTimeout(() => this.successMessages[String(reg.id)] = '', 3000); // auto-clear
        })
        .catch(err => {
          console.error(err);
          this.errorMessages[String(reg.id)] = 'Failed to update status. Try again.';
      });
    }
}
