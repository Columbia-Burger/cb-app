import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FavoriteProduct {
  name: string;
  image: string;
}

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
})
export class FavoritesComponent {
  readonly favorites: FavoriteProduct[] = [
    { name: 'Nombre Producto', image: 'assets/burger.jpg' },
    { name: 'Nombre Producto', image: 'assets/burger.jpg' },
    { name: 'Nombre Producto', image: 'assets/burger.jpg' },
  ];
}
