import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [RouterModule, CommonModule, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class Layout {
menuOpen = false;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}
