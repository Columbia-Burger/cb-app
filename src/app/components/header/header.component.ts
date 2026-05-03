import { Component, HostListener, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly router = inject(Router);

  readonly whatsappUrl = `https://wa.me/${environment.whatsappNumber}?text=${environment.whatsappText}`;

  scrolled = false;
  hidden = false;
  menuOpen = false;

  private lastScrollY = 0;

  @HostListener('window:scroll')
  onScroll(): void {
    const y = window.scrollY;
    this.scrolled = y > 10;
    if (!this.menuOpen) {
      if (y <= 50) {
        this.hidden = false;
      } else if (y > this.lastScrollY) {
        this.hidden = true;
      } else if (y < this.lastScrollY) {
        this.hidden = false;
      }
    }
    this.lastScrollY = y;
  }

  goToContacto(): void {
    this.menuOpen = false;
    if (this.router.url.startsWith('/menu')) {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => {
          document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
    } else {
      document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
