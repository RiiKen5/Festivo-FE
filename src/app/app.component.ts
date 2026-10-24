import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ToastComponent } from './shared/components/toast/toast.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { SiteFooterComponent } from './shared/components/site-footer/site-footer.component';
import { AttributionService } from './core/services/attribution.service';
import { AnalyticsService } from './core/services/analytics.service';
import { RealtimeService } from './core/services/realtime.service';
import { AuthService } from './core/services/auth.service';
import { ToastService } from './core/services/toast.service';
import { User } from './core/models/user.model';

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
  private analytics = inject(AnalyticsService);
  private url = signal(this.router.url);

  constructor() {
    inject(AttributionService).capture();
    this.analytics.init();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      this.url.set((e as NavigationEnd).urlAfterRedirects);
      this.analytics.page((e as NavigationEnd).urlAfterRedirects.split('?')[0]);
    });

    // Live updates on every page; a short popup unless the chat is already open
    const realtime = inject(RealtimeService);
    const auth = inject(AuthService);
    const toast = inject(ToastService);
    realtime.newMessage$.subscribe(message => {
      const sender = message.sender as User;
      if (sender?._id === auth.currentUser()?._id || this.url().startsWith('/messages')) return;
      toast.info(`Message from ${sender?.name || 'someone'}`, message.messageText.slice(0, 80));
    });
    realtime.notification$.subscribe(n => {
      if (n.type !== 'message') toast.info(n.title, n.message);
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
