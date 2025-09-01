import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthAnimationService {
  constructor(private router: Router) {}

  togglePanel(showRegister: boolean) {
    this.router.navigate([showRegister ? '/register' : '/login']);
  }
} 