import type { ListingDetail } from './catalog.models';

export type PaymentStatus = 'PENDING' | 'HOLD_ESCROW' | 'RELEASED_TO_SELLER' | 'REFUNDED';

export type InspectionStatus = 'PENDING' | 'IN_REVIEW' | 'PASSED' | 'FAILED';
export type ComponentResult = 'OK' | 'WARNING' | 'FAIL';

/** Estado de la revisión técnica de una pieza, tal como la devuelve GET /orders. */
export interface OrderItemInspection {
  status: InspectionStatus;
  completedAt: string | null;
}

export interface OrderItem {
  orderItemId: string;
  publicationId: string;
  sellerId: string;
  description: string | null;
  price: number;
  inspection: OrderItemInspection | null;
}

export interface Order {
  orderId: string;
  buyerId: string;
  buyerEmail: string | null;
  orderType: string;
  status: string;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
  items: OrderItem[];
}

/** Compra en un paso: el precio y el comprador los resuelve el BFF, no el cliente. */
export interface CheckoutRequest {
  publicationIds: string[];
  buyerEmail: string;
}

export interface InspectionCheck {
  component: string;
  result: ComponentResult;
  note: string | null;
}

export interface Inspection {
  id: string;
  orderId: string;
  orderItemId: string;
  publicationId: string | null;
  description: string | null;
  buyerId: string;
  buyerEmail: string | null;
  sellerId: string;
  status: InspectionStatus;
  agentId: string | null;
  maintenanceDone: string | null;
  maintenanceDate: string | null;
  workshopNotes: string | null;
  checks: InspectionCheck[];
  completedAt: string | null;
  createdAt: string;
  /** Datos de la pieza (fotos, producto, vendedor) para comparar con la pieza física. */
  listing?: ListingDetail | null;
}

/** Formulario del admin: mantenimiento hecho, fecha, resultado y notas. */
export interface CompleteInspectionRequest {
  result: 'PASSED' | 'FAILED';
  maintenanceDone: string;
  maintenanceDate?: string;
  notes?: string;
  checks?: InspectionCheck[];
}

export type ShipmentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export interface ShipmentEvent {
  status: ShipmentStatus;
  location: string | null;
  note: string | null;
  createdAt: string;
}

export interface Shipment {
  id: number;
  trackingCode: string;
  orderId: string;
  description: string | null;
  buyerId: string;
  sellerId: string;
  originComuna: string;
  destination: { recipientName: string; street: string; streetNumber: string; comuna: string; region: string };
  shippingCost: number;
  status: ShipmentStatus;
  estimatedDelivery: string | null;
  events: ShipmentEvent[];
}

/** Transiciones permitidas por ms-shipments (ShipmentStatus.allowedNext). */
export const SHIPMENT_NEXT: Record<ShipmentStatus, ShipmentStatus[]> = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'RETURNED'],
  DELIVERED: [],
  CANCELLED: [],
  RETURNED: [],
};
