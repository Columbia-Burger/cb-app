import { Component } from '@angular/core';
import { SPECIAL_OF_MONTH, SpecialProduct } from '../../data/featured.data';

@Component({
  selector: 'app-special',
  standalone: true,
  imports: [],
  templateUrl: './special.component.html',
  styleUrl: './special.component.scss',
})
export class SpecialComponent {
  readonly special: SpecialProduct = SPECIAL_OF_MONTH;
}
