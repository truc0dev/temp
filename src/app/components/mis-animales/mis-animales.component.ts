import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnimalesService } from '../../services/animales.service';
import { AuthService } from '../../services/auth.service';
import { Animal } from '../../interfaces/animal.interface';
import { MiGanadoComponent } from '../mi-ganado/mi-ganado.component';

@Component({
  selector: 'app-mis-animales',
  standalone: true,
  imports: [MiGanadoComponent],
  template: `<app-mi-ganado></app-mi-ganado>`
})
export class MisAnimalesComponent {} 