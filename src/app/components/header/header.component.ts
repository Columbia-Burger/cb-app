import { Component, inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);

  readonly whatsappUrl = `https://wa.me/${environment.whatsappNumber}?text=${environment.whatsappText}`;

  scrolled = false;
  hidden = false;
  menuOpen = false;

  private lastScrollY = 0;
  private readonly scrollHandler = () => {
    const y = window.scrollY;
    const nextScrolled = y > 40;
    let nextHidden = this.hidden;

    if (!this.menuOpen) {
      if (y < 80) {
        nextHidden = false;
      } else if (y > this.lastScrollY + 8) {
        nextHidden = true;
      } else if (y < this.lastScrollY - 8) {
        nextHidden = false;
      }
    }
    this.lastScrollY = y;

    if (nextScrolled !== this.scrolled || nextHidden !== this.hidden) {
      this.zone.run(() => {
        this.scrolled = nextScrolled;
        this.hidden = nextHidden;
      });
    }
  };

  ngOnInit(): void {
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollHandler);
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
