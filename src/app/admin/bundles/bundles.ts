import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BundleRegistration, BundleService } from '../../services/bundles.service';

@Component({
  selector: 'app-bundles',
  imports: [CommonModule, FormsModule],
  templateUrl: './bundles.html',
  styleUrl: './bundles.scss'
})
export class Bundles {
  bundles: BundleRegistration[] = [];
  loading = true;

  // Filters
  selectedBundleTitle: string = '';
  selectedPaymentStatus: string = '';
  purchaseSearch: string = '';

  statuses = ['PaymentPending', 'PaymentConfirmed'];

  // Store temporary selections before saving
  selectedStatuses: { [docId: string]: string } = {};
  
  // Store success and error messages
  successMessages: { [docId: string]: string } = {};
  errorMessages: { [docId: string]: string } = {};
  emailSuccessMessages: { [docId: string]: string } = {};
  emailErrorMessages: { [docId: string]: string } = {};

  // For filtering dropdown
  allBundleTitles: string[] = [];
  isEmailSending: { [docId: string]: boolean } = {};

  constructor(private bundleService: BundleService) {}

  ngOnInit() {
    this.bundleService.getOrders().subscribe((data: BundleRegistration[]) => {
      // Add docId property from Firestore ID
      this.bundles = data.map(b => ({
        ...b,
        docId: b.docId || (b as any).id // fallback if Firestore id field is 'id'
      }));
      this.loading = false;

      // Get unique bundle IDs for filter dropdown
      this.allBundleTitles = Array.from(new Set(this.bundles.map(b => b.bundleTitle))).filter(Boolean);

      // Initialize selectedStatuses using docId
      this.bundles.forEach(b => {
        if (b.docId) {
          this.selectedStatuses[b.docId] = b.status;
        }
      });
    });
  }

  // Filtered view
  get filteredBundles(): BundleRegistration[] {
    let filtered = this.bundles;

    // Filter by bundle ID
    if (this.selectedBundleTitle) {
      filtered = filtered.filter(reg => reg.bundleTitle === this.selectedBundleTitle);
    }

    // Filter by payment status
    if (this.selectedPaymentStatus) {
      filtered = filtered.filter(reg => reg.status === this.selectedPaymentStatus);
    }

    // Filter by purchase ID search
    if (this.purchaseSearch) {
      const searchLower = this.purchaseSearch.toLowerCase();
      filtered = filtered.filter(reg => reg.bundlePurchaseId?.toLowerCase().includes(searchLower));
    }

    return filtered;
  }

  // Helper to display recordings comma-separated
  getRecordingTitles(recordings?: { Title: string; recId: string }[]): string {
    return recordings?.map(r => r.Title).join(', ') || 'No recordings included';
  }

  // Status change locally
  onStatusChange(reg: BundleRegistration, newStatus: string) {
    if (!reg.docId) return;
    this.selectedStatuses[reg.docId] = newStatus;
  }

  // Save status to Firestore
  saveStatus(reg: BundleRegistration) {
    if (!reg.docId) return;
    const newStatus = this.selectedStatuses[reg.docId];

    this.successMessages[reg.docId] = '';
    this.errorMessages[reg.docId] = '';

    this.bundleService.updateStatus(reg.docId, newStatus)
      .then(() => {
        reg.status = newStatus;
        this.successMessages[reg.docId!] = `Status updated to ${newStatus}`;
        setTimeout(() => this.successMessages[reg.docId!] = '', 10000);
      })
      .catch(err => {
        console.error(err);
        this.errorMessages[reg.docId!] = 'Failed to update status. Try again.';
      });
  }

  // Send email
  sendEmail(reg: BundleRegistration) {
    if (!reg.docId || this.isEmailSending[reg.docId!]) return; // Prevent multiple clicks

    // Set loading state to true
    this.isEmailSending[reg.docId!] = true;

    this.emailSuccessMessages[reg.docId!] = '';
    this.emailErrorMessages[reg.docId!] = '';

    this.bundleService.sendEmail(reg)
      .then(() => {
        reg.emailSent = true;
        this.emailSuccessMessages[reg.docId!] = 'Email sent successfully!';
        this.bundleService.addRecording(reg);
        setTimeout(() => this.emailSuccessMessages[reg.docId!] = '', 10000);
      })
      .catch(() => {
        this.emailErrorMessages[reg.docId!] = 'Failed to send email. Try again.';
      })
      .finally(() => {
        // Reset loading state after the email process is complete
        this.isEmailSending[reg.docId!] = false;
      });
  }
}
