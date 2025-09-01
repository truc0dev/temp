import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InversionFormComponent } from './inversion-form/inversion-form.component';
import { InversionListComponent } from './inversion-list/inversion-list.component';
import { InversionAnalyticsComponent } from './inversion-analytics/inversion-analytics.component';
import { InversionTicketComponent } from './inversion-ticket/inversion-ticket.component';

@Component({
  selector: 'app-inversiones',
  standalone: true,
  imports: [
    CommonModule,
    InversionFormComponent,
    InversionListComponent,
    InversionAnalyticsComponent,
    InversionTicketComponent
  ],
  templateUrl: './inversiones.component.html',
  styleUrls: ['./inversiones.component.scss']
})
export class InversionesComponent {
  constructor() {}
} 