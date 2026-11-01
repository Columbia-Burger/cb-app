import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-hero-carousel',
    imports: [RouterLink],
    templateUrl: './hero-carousel.component.html',
    styleUrl: './hero-carousel.component.scss'
})
export class HeroCarouselComponent {
  readonly whatsappUrl = `https://wa.me/${environment.whatsappNumber}?text=${environment.whatsappText}`;

  readonly slides = [
    { image: 'assets/Banner-canva.jpg', alt: 'El antojo perfecto' },
  ];
}
