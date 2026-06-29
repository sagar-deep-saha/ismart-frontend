import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms-of-service',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './terms-of-service.component.html',
  styles: []
})
export class TermsOfServiceComponent implements OnInit {
  ngOnInit() {
    window.scrollTo(0, 0);
  }
}
