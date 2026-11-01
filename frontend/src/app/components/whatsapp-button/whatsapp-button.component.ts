import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-whatsapp-button',
    imports: [],
    templateUrl: './whatsapp-button.component.html',
    styleUrl: './whatsapp-button.component.scss'
})
export class WhatsappButtonComponent {
  readonly whatsappUrl = `https://wa.me/${environment.whatsappNumber}?text=${environment.whatsappText}`;
}
