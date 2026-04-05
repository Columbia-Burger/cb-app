import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly whatsappUrl = `https://wa.me/${environment.whatsappNumber}?text=${environment.whatsappText}`;

  scrolled = false;
  menuOpen = false;

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled = window.scrollY > 40;
  }
}
