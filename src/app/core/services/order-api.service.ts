import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CompleteInspectionRequest,
  CheckoutRequest,
  Inspection,
  Order,
  Shipment,
  ShipmentStatus,
} from '../models/order.models';

/** Compras, revisión técnica y envíos: todo pasa por el BFF. */
@Injectable({ providedIn: 'root' })
export class OrderApiService {
  private readonly baseUrl = environment.bffBaseUrl;

  constructor(private readonly http: HttpClient) {}

  // --- Compras ---
  /** Compra en un paso (pago simulado): el BFF valida las publicaciones y cobra. */
  buy(body: CheckoutRequest): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders`, body);
  }

  /** Mis compras, con el estado de la revisión técnica de cada pieza. */
  listOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/orders`);
  }

  // --- Revisión técnica (solo WORKSHOP_ADMIN) ---
  listInspections(): Observable<Inspection[]> {
    return this.http.get<Inspection[]>(`${this.baseUrl}/inspections`);
  }

  completeInspection(id: string, body: CompleteInspectionRequest): Observable<Inspection> {
    return this.http.post<Inspection>(`${this.baseUrl}/inspections/${id}/complete`, body);
  }

  downloadReport(orderItemId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/reports/${orderItemId}`, { responseType: 'blob' });
  }

  // --- Envíos ---
  listShipments(as: 'buyer' | 'seller' = 'buyer'): Observable<Shipment[]> {
    return this.http.get<Shipment[]>(`${this.baseUrl}/shipping/shipments`, { params: { as } });
  }

  updateShipmentStatus(
    id: number,
    status: ShipmentStatus,
    location?: string,
    note?: string,
  ): Observable<Shipment> {
    return this.http.patch<Shipment>(`${this.baseUrl}/shipping/shipments/${id}/status`, {
      status,
      location: location || null,
      note: note || null,
    });
  }
}
