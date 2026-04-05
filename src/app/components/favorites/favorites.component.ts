import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FAVORITES, FavoriteProduct } from '../../data/featured.data';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
})
export class FavoritesComponent {
  readonly favorites: FavoriteProduct[] = FAVORITES;
}
