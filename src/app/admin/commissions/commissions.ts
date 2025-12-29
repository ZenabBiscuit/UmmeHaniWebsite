import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommissionService, CommissionRequest } from '../../services/commission.service';

@Component({
  selector: 'app-admin-commissions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './commissions.html',
  styleUrl: './commissions.scss'
})

export class AdminCommissions {
  requests: CommissionRequest[] = [];
  loading = true;

  constructor(private commissionService: CommissionService) { }

  ngOnInit() {
    this.commissionService.getRequests().subscribe(data => {
      this.requests = data.sort((a, b) =>
        (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      this.loading = false;
    });
  }

  deleteRequest(req: CommissionRequest) {
    if (!req.id) return;
    if (confirm(`Delete request from ${req.name}?`)) {
      this.commissionService.deleteRequest(req.id);
    }
  }
}
