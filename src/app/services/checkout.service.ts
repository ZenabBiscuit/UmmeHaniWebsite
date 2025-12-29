// checkout.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private cart: any = {};


  setCart(token: string, product: any) {
    this.cart[token] = product;

    // also save to localStorage
    localStorage.setItem('cart_' + token, JSON.stringify(product));

  }

  getCart(token: string) {
    // first check in memory
    if (this.cart[token]) 
      return this.cart[token];

    // fallback to localStorage
    const stored = localStorage.getItem('cart_' + token);
    return stored ? JSON.parse(stored) : null;
  }

  clearCart(token: string) {
    delete this.cart[token];
    localStorage.removeItem('cart_' + token);
  }
}
