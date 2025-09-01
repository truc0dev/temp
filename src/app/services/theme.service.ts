import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkTheme = new BehaviorSubject<boolean>(this.getInitialTheme());
  isDarkTheme$ = this.isDarkTheme.asObservable();

  constructor() {
    this.setInitialTheme();
  }

  private getInitialTheme(): boolean {
    const savedTheme = localStorage.getItem('darkTheme');
    if (savedTheme) {
      return JSON.parse(savedTheme);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private setInitialTheme() {
    const isDark = this.isDarkTheme.value;
    this.updateTheme(isDark);
  }

  toggleTheme() {
    const isDark = !this.isDarkTheme.value;
    this.isDarkTheme.next(isDark);
    this.updateTheme(isDark);
    localStorage.setItem('darkTheme', JSON.stringify(isDark));
  }

  private updateTheme(isDark: boolean) {
    const root = document.documentElement;
    if (isDark) {
      root.style.setProperty('--background-light', '#1a1a1a');
      root.style.setProperty('--background-grey', '#242424');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#a0a0a0');
      root.style.setProperty('--border-color', '#333333');
      root.style.setProperty('--shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.2)');
      root.style.setProperty('--shadow-md', '0 4px 6px rgba(0, 0, 0, 0.2)');
      root.style.setProperty('--shadow-lg', '0 10px 15px rgba(0, 0, 0, 0.2)');
    } else {
      root.style.setProperty('--background-light', '#ffffff');
      root.style.setProperty('--background-grey', '#f7f7f8');
      root.style.setProperty('--text-primary', '#202123');
      root.style.setProperty('--text-secondary', '#6e6e80');
      root.style.setProperty('--border-color', '#e5e5e5');
      root.style.setProperty('--shadow-sm', '0 1px 2px rgba(0, 0, 0, 0.05)');
      root.style.setProperty('--shadow-md', '0 4px 6px rgba(0, 0, 0, 0.05)');
      root.style.setProperty('--shadow-lg', '0 10px 15px rgba(0, 0, 0, 0.05)');
    }
  }
} 