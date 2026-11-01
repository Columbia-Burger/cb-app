import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { HeroCarouselComponent } from '../../components/hero-carousel/hero-carousel.component';
import { FavoritesComponent } from '../../components/favorites/favorites.component';
import { SpecialComponent } from '../../components/special/special.component';
import { MapInfoComponent } from '../../components/map-info/map-info.component';
import { WhatsappButtonComponent } from '../../components/whatsapp-button/whatsapp-button.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    HeaderComponent,
    HeroCarouselComponent,
    FavoritesComponent,
    SpecialComponent,
    MapInfoComponent,
    WhatsappButtonComponent,
    FooterComponent,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent {}
