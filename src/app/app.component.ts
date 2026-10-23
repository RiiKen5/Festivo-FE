import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ToastComponent } from './shared/components/toast/toast.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SiteFooterComponent } from './shared/components/site-footer/site-footer.component';

// App shell: one header and footer for every screen except the full-screen
// auth pages and the messages workspace (which needs the full height).
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, NavbarComponent, SiteFooterComponent],
  template: `
    <a class="skip-link" href="#main" (click)="skipToMain($event)">Skip to content</a>
    @if (!isAuthPage()) {
      <app-navbar></app-navbar>
    }
    <div id="main" tabindex="-1" class="app-main">
      <router-outlet></router-outlet>
    </div>
    @if (!isAuthPage() && !isWorkspacePage()) {
      <app-site-footer></app-site-footer>
    }
    <app-toast></app-toast>
  `,
  styles: [`
    .app-main {
      min-height: 60vh;
      outline: none;
    }
  `]
})
export class AppComponent {
  private router = inject(Router);
  private url = signal(this.router.url);

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      this.url.set((e as NavigationEnd).urlAfterRedirects);
    });
  }

  isAuthPage(): boolean {
    return this.url().startsWith('/auth');
  }

  isWorkspacePage(): boolean {
    return this.url().startsWith('/messages');
  }

  skipToMain(event: Event): void {
    event.preventDefault();
    document.getElementById('main')?.focus();
  }
}
