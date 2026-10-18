import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Order } from '../../../core/models/order.models';
import { CartService } from '../../../core/services/cart.service';
import { OrderApiService } from '../../../core/services/order-api.service';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_KEY = 'pcb.buyerEmail';

@Component({
  selector: 'app-cart-page',
  imports: [DecimalPipe, RouterLink, FormsModule],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.css',
})
export class CartPage {
  readonly buying = signal(false);
  readonly error = signal<string | null>(null);
  readonly paidOrder = signal<Order | null>(null);
  readonly email = signal(this.savedEmail());
  readonly emailValid = computed(() => EMAIL.test(this.email().trim()));

  constructor(
    readonly cart: CartService,
    readonly auth: AuthService,
    private readonly orders: OrderApiService,
  ) {}

  /** Compra en un paso: el BFF valida las piezas, cobra (pago simulado) y deja la revisión pendiente. */
  buy(): void {
    if (this.buying() || !this.emailValid()) return;
    this.buying.set(true);
    this.error.set(null);
    const buyerEmail = this.email().trim();

    this.orders.buy({ publicationIds: this.cart.items().map((i) => i.publicationId), buyerEmail }).subscribe({
      next: (order) => {
        this.saveEmail(buyerEmail);
        this.paidOrder.set(order);
        this.cart.clear();
        this.buying.set(false);
      },
      error: (err) => {
        const message = err instanceof HttpErrorResponse ? err.error?.message : null;
        this.error.set(message ?? 'No se pudo completar la compra.');
        this.buying.set(false);
      },
    });
  }

  private savedEmail(): string {
    try {
      return localStorage.getItem(EMAIL_KEY) ?? '';
    } catch {
      return '';
    }
  }

  private saveEmail(value: string): void {
    try {
      localStorage.setItem(EMAIL_KEY, value);
    } catch {
      /* sin almacenamiento: se pide de nuevo la próxima vez */
    }
  }
}
