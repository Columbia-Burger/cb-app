import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';

export interface DeliveryZone {
  name: string;
  price: number;
}

const DELIVERY_ZONES: DeliveryZone[] = [
  { name: 'Danubio Azul',   price: 2000 },
  { name: 'La Paz',         price: 3000 },
  { name: 'La Fiscala',     price: 4000 },
  { name: 'Éxito',          price: 6000 },
  { name: 'Artillería',     price: 5000 },
  { name: 'Picota',         price: 5000 },
  { name: 'Diana Turbay',   price: 6000 },
  { name: 'Aptos Caracas',  price: 3000 },
];

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  readonly cart = inject(CartService);
  readonly isOpen = signal(false);

  readonly zones = DELIVERY_ZONES;
  selectedZone: DeliveryZone | null = null;

  readonly grandTotal = computed(() => {
    return this.cart.total() + (this.selectedZone?.price ?? 0);
  });

  readonly formattedGrandTotal = computed(() => {
    return `$${this.grandTotal().toLocaleString('es-CO')}`;
  });

  toggle(): void {
    this.isOpen.update((v) => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  onZoneChange(zoneName: string): void {
    this.selectedZone = this.zones.find((z) => z.name === zoneName) ?? null;
  }

  formattedDelivery(): string {
    if (!this.selectedZone) return '';
    return `$${this.selectedZone.price.toLocaleString('es-CO')}`;
  }

  orderOnWhatsApp(): void {
    const url = this.cart.buildWhatsAppUrl(this.selectedZone);
    if (url) window.open(url, '_blank');
  }
}
