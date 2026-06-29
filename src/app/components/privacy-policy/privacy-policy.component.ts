import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './privacy-policy.component.html',
  styles: []
})
export class PrivacyPolicyComponent implements OnInit {
  ngOnInit() {
    window.scrollTo(0, 0);
  }
}
