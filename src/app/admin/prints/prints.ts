import { Component } from '@angular/core';
import { OrderService, Order } from '../../services/orders.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-prints',
  imports: [CommonModule, FormsModule],
  templateUrl: './prints.html',
  styleUrl: './prints.scss'
})

export class Prints {
  orders: Order[] = [];
  loading = true;
  statuses = ['PaymentPending', 'PaymentConfirmed', 'InProgress', 'Delivered'];

   // Store temporary selections before saving
  selectedStatuses: { [orderId: string]: string } = {};

  // Store success and error messages
  successMessages: { [orderId: string]: string } = {};
  errorMessages: { [orderId: string]: string } = {};

  // 🔹 New filter properties
  selectedStatusFilter: string = '';
  StatusForFilter: string[] = [];
  orderSearch: string = '';

  
  // 🔹 New filter properties
  selectedOriginal: string = '';
  originalTitles: string[] = [];
  

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.orderService.getPrintsOrders().subscribe(data => {
      this.orders = data;
      this.loading = false;

      // Collect unique workshop titles
      this.originalTitles = Array.from(new Set(data.map(reg => reg.product?.Title))).filter(Boolean);


      // initialize selectedStatuses with current order status
      // initialize selectedStatuses with existing order status
    this.orders.forEach(order => {
      if (order.id) {
        this.selectedStatuses[order.id] = order.status;
      }
    });
    });

    this.StatusForFilter = this.statuses;
  }

  get filteredOrders(): Order[] {

        let filtered = this.orders;

        if(this.selectedOriginal){
        filtered = filtered.filter(reg => reg.product?.Title === this.selectedOriginal);
      }

      if(this.selectedStatusFilter){
        filtered = filtered.filter(reg => reg.status === this.selectedStatusFilter)
      }
      
      if (this.orderSearch) {
        const searchLower = this.orderSearch.toLowerCase();
        filtered = filtered.filter(reg => reg.orderId.toLowerCase().includes(searchLower));
      }

      return filtered;
      }

  onStatusChange(order: Order, newStatus: string) {
    if (!order.id) return;
    this.selectedStatuses[order.id] = newStatus; // just store locally
  }

  saveStatus(order: Order) {
    if (!order.id) return;
    const newStatus = this.selectedStatuses[order.id];

    this.successMessages[order.id] = '';
    this.errorMessages[order.id] = '';

    this.orderService.updatePrintsStatus(order.id, newStatus)
      .then(() => {
        order.status = newStatus; // keep UI in sync
        this.successMessages[String(order.id)] = `Status updated to ${newStatus}`;
        setTimeout(() => this.successMessages[String(order.id)] = '', 3000); // auto-clear
      })
      .catch(err => {
        console.error(err);
        this.errorMessages[String(order.id)] = 'Failed to update status. Try again.';
    });
  }

  sendWhatsappMessage(order: any){
    const recipientPhone = order.address.phone;  // assuming you have customerPhone in the order
    const message = `Hello ${order.address.firstName},
Your order #${order.orderId} is confirmed! 
Sit back and relax while your order makes its way to your home.

Best Regards,
Umme Hani`;
    // URL encode the message
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${recipientPhone}?text=${encodedMessage}`;

    // Open WhatsApp in a new window/tab
    window.open(whatsappUrl, '_blank');

  }
}