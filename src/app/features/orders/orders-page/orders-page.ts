import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Order, Shipment } from '../../../core/models/order.models';
import { OrderApiService } from '../../../core/services/order-api.service';

@Component({
  selector: 'app-orders-page',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.css',
})
export class OrdersPage implements OnInit {
  readonly orders = signal<Order[]>([]);
  readonly shipments = signal<Shipment[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly downloading = signal<string | null>(null);

  constructor(private readonly api: OrderApiService) {}

  ngOnInit(): void {
    forkJoin({ orders: this.api.listOrders(), shipments: this.api.listShipments('buyer') }).subscribe({
      next: ({ orders, shipments }) => {
        this.orders.set([...orders].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
        this.shipments.set(shipments);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar tus pedidos.');
        this.loading.set(false);
      },
    });
  }

  shipmentsOf(orderId: string): Shipment[] {
    return this.shipments().filter((s) => s.orderId === orderId);
  }

  downloadReport(orderItemId: string): void {
    this.downloading.set(orderItemId);
    this.api.downloadReport(orderItemId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `informe-tecnico-${orderItemId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloading.set(null);
      },
      error: () => {
        this.error.set('El informe todavía no está disponible.');
        this.downloading.set(null);
      },
    });
  }
}
