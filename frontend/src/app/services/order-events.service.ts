import { Injectable, NgZone, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderResponse } from '../admin/models/admin.model';

export interface OrderEvent {
  type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_INVOICED';
  order: OrderResponse;
  printAtAdmin?: boolean;
}

@Injectable({ providedIn: 'root' })
export class OrderEventsService {
  private zone = inject(NgZone);

  connect(token: string | null): Observable<OrderEvent> {
    return new Observable<OrderEvent>((subscriber) => {
      if (!token) {
        subscriber.error(new Error('Missing auth token'));
        return undefined;
      }

      const url = `${environment.businessApiUrl}/api/orders/events?token=${encodeURIComponent(token)}`;
      const source = new EventSource(url);

      const handleEvent = (event: MessageEvent<string>) => {
        this.zone.run(() => subscriber.next(JSON.parse(event.data) as OrderEvent));
      };

    source.addEventListener('ORDER_CREATED', handleEvent);
    source.addEventListener('ORDER_UPDATED', handleEvent);
    source.addEventListener('ORDER_INVOICED', handleEvent);
      source.onerror = () => {
        if (source.readyState === EventSource.CLOSED) {
          subscriber.complete();
        }
      };

      return () => source.close();
    });
  }
}
