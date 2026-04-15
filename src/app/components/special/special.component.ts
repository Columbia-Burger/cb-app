import { Component, inject, signal, OnInit } from '@angular/core';
import { CatalogService } from '../../services/catalog.service';
import { SpecialProduct } from '../../data/featured.data';

@Component({
  selector: 'app-special',
  standalone: true,
  imports: [],
  templateUrl: './special.component.html',
  styleUrl: './special.component.scss',
})
export class SpecialComponent implements OnInit {
  private readonly catalog = inject(CatalogService);
  special = signal<SpecialProduct | null>(null);

  ngOnInit(): void {
    this.catalog.getActiveSpecial().subscribe(s => this.special.set(s));
  }
}
