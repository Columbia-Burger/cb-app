import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { ContactFormComponent } from '../contact-form/contact-form.component';

@Component({
  selector: 'app-map-info',
  standalone: true,
  imports: [ContactFormComponent],
  templateUrl: './map-info.component.html',
  styleUrl: './map-info.component.scss',
})
export class MapInfoComponent {
  readonly whatsappUrl = `https://wa.me/${environment.whatsappNumber}?text=${environment.whatsappText}`;

  readonly mapUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15909.216064003205!2d-74.13558921284181!3d4.539186300000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3fa38aacc47411%3A0xd5f9e5ad52f825fb!2sColumbia%20Burger!5e0!3m2!1ses-419!2sco!4v1724220122536!5m2!1ses-419!2sco'
    );
  }
}
