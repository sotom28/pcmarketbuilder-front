import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Inspection, SHIPMENT_NEXT, Shipment, ShipmentStatus } from '../../../core/models/order.models';
import { OrderApiService } from '../../../core/services/order-api.service';

type Tab = 'open' | 'shipments';

@Component({
  selector: 'app-agent-panel',
  imports: [DatePipe, FormsModule],
  templateUrl: './agent-panel.html',
  styleUrl: './agent-panel.css',
})
export class AgentPanel implements OnInit {
  readonly tab = signal<Tab>('open');
  readonly inspections = signal<Inspection[]>([]);
  readonly shipments = signal<Shipment[]>([]);
  readonly loading = signal(false);
  readonly busyId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly info = signal<string | null>(null);

  // Inspección que se está revisando (formulario simple del taller).
  readonly reviewing = signal<Inspection | null>(null);
  verdict: 'PASSED' | 'FAILED' = 'PASSED';
  maintenanceDone = '';
  maintenanceDate = '';
  notes = '';

  constructor(private readonly api: OrderApiService) {}

  ngOnInit(): void {
    this.load();
  }

  select(tab: Tab): void {
    this.tab.set(tab);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const done = () => this.loading.set(false);
    const fail = (err: unknown) => {
      this.error.set(this.messageOf(err, 'No se pudo cargar la información.'));
      done();
    };
    if (this.tab() === 'shipments') {
      this.api.listShipments('buyer').subscribe({
        next: (list) => {
          this.shipments.set(list);
          done();
        },
        error: fail,
      });
    } else {
      this.api.listInspections().subscribe({
        next: (list) => {
          this.inspections.set(list);
          done();
        },
        error: fail,
      });
    }
  }

  startReview(inspection: Inspection): void {
    this.reviewing.set(inspection);
    this.verdict = 'PASSED';
    this.maintenanceDone = '';
    this.maintenanceDate = new Date().toISOString().slice(0, 10);
    this.notes = '';
    this.info.set(null);
  }

  /** Cierra la revisión: reports genera el PDF y manda los correos al comprador. */
  complete(): void {
    const inspection = this.reviewing();
    if (!inspection || !this.maintenanceDone.trim()) return;
    this.busyId.set(inspection.id);
    this.api
      .completeInspection(inspection.id, {
        result: this.verdict,
        maintenanceDone: this.maintenanceDone.trim(),
        maintenanceDate: this.maintenanceDate || undefined,
        notes: this.notes.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.reviewing.set(null);
          this.busyId.set(null);
          this.info.set('Informe en proceso: se enviará al comprador.');
          this.load();
        },
        error: (err) => {
          this.error.set(this.messageOf(err, 'No se pudo completar la inspección.'));
          this.busyId.set(null);
          if (err instanceof HttpErrorResponse && err.status === 409) {
            this.reviewing.set(null);
            this.load();
          }
        },
      });
  }

  nextStatuses(s: Shipment): ShipmentStatus[] {
    return SHIPMENT_NEXT[s.status];
  }

  changeShipmentStatus(s: Shipment, status: ShipmentStatus): void {
    if (!status) return;
    this.busyId.set(String(s.id));
    this.api.updateShipmentStatus(s.id, status).subscribe({
      next: (updated) => {
        this.shipments.set(this.shipments().map((x) => (x.id === updated.id ? updated : x)));
        this.busyId.set(null);
      },
      error: (err) => {
        this.error.set(this.messageOf(err, 'No se pudo actualizar el envío.'));
        this.busyId.set(null);
      },
    });
  }

  private messageOf(err: unknown, fallback: string): string {
    return (err instanceof HttpErrorResponse && err.error?.message) || fallback;
  }
}
