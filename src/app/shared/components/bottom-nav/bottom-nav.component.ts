import { Component, DestroyRef, ElementRef, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { MessageService } from '../../../core/services/message.service';
import { NotificationService } from '../../../core/services/notification.service';
import { IconComponent } from '../icon/icon.component';

interface NavItem {
  label: string;
  icon: string;
  link?: string;
  action?: 'logout';
  badge?: number;
}

interface NavTab {
  label: string;
  icon: string;
  // A tab with a link opens it; a tab with items fans them out in an arc
  link?: string;
  items?: NavItem[];
  badge?: number;
}

interface PlacedItem extends NavItem {
  x: number;
  y: number;
  delay: number;
}

const OPEN_MS = 260;

/**
 * Phone navigation: four tabs along the bottom of the screen. Tapping a tab
 * with sub-pages fans them out in an arc rising from the bar. Hidden from
 * the md breakpoint up, where the top navbar shows everything.
 */
@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterModule, IconComponent],
  template: `
    @if (open() !== null) {
      <div class="arc" [class.arc--shown]="shown()" (click)="close()">
        <div class="arc__backdrop"></div>
        <p class="arc__title" aria-hidden="true">{{ tabs()[open()!].label }}</p>
        <nav class="arc__menu" role="menu" [attr.aria-label]="tabs()[open()!].label" (click)="$event.stopPropagation()">
          @for (item of placed(); track item.label) {
            @if (item.link) {
              <a role="menuitem" class="arc__item" [routerLink]="item.link" (click)="close()"
                 [style.--x]="item.x + 'px'" [style.--y]="item.y + 'px'" [style.--from]="origin() + 'px'"
                 [style.transition-delay.ms]="item.delay">
                <span class="arc__bubble" [class.arc__bubble--current]="isCurrent(item.link)">
                  <app-icon [name]="item.icon" [size]="22"></app-icon>
                  @if (item.badge) { <span class="badge" aria-hidden="true">{{ count(item.badge) }}</span> }
                </span>
                <span class="arc__label">{{ item.label }}@if (item.badge) {<span class="visually-hidden">, {{ item.badge }} unread</span>}</span>
              </a>
            } @else {
              <button type="button" role="menuitem" class="arc__item" (click)="run(item)"
                      [style.--x]="item.x + 'px'" [style.--y]="item.y + 'px'" [style.--from]="origin() + 'px'"
                      [style.transition-delay.ms]="item.delay">
                <span class="arc__bubble arc__bubble--quiet"><app-icon [name]="item.icon" [size]="22"></app-icon></span>
                <span class="arc__label">{{ item.label }}</span>
              </button>
            }
          }
        </nav>
      </div>
    }

    <nav class="bar" aria-label="Main">
      @for (tab of tabs(); track tab.label; let i = $index) {
        @if (tab.link) {
          <a class="bar__tab" [routerLink]="tab.link" [class.bar__tab--active]="activeTab() === i" (click)="close()">
            <app-icon [name]="tab.icon" [size]="22"></app-icon>
            <span>{{ tab.label }}</span>
          </a>
        } @else {
          <button type="button" class="bar__tab" [class.bar__tab--active]="activeTab() === i" [class.bar__tab--open]="open() === i"
                  aria-haspopup="menu" [attr.aria-expanded]="open() === i" (click)="toggle(i, $event)">
            <span class="bar__icon">
              <app-icon [name]="open() === i ? 'x' : tab.icon" [size]="22"></app-icon>
              @if (tab.badge && open() !== i) { <span class="badge" aria-hidden="true">{{ count(tab.badge) }}</span> }
            </span>
            <span>{{ tab.label }}@if (tab.badge) {<span class="visually-hidden">, {{ tab.badge }} unread</span>}</span>
          </button>
        }
      }
    </nav>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;

    :host {
      display: block;

      @include md {
        display: none;
      }
    }

    .bar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: $z-fixed;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      height: calc(64px + env(safe-area-inset-bottom));
      padding-bottom: env(safe-area-inset-bottom);
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: saturate(180%) blur(8px);
      border-top: 1px solid $border-light;
    }

    .bar__tab {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      border: none;
      background: none;
      color: $text-tertiary;
      font-size: 11px;
      font-weight: $font-weight-medium;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: color $transition-fast;

      app-icon { transition: transform $transition-default; }

      &--active { color: $primary-700; }
      &--open {
        color: $primary-700;
        app-icon { transform: rotate(90deg); }
      }
    }

    .bar__icon { position: relative; display: inline-flex; }

    .badge {
      position: absolute;
      top: -6px;
      right: -10px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 9px;
      background: $primary-600;
      color: #fff;
      font-size: 10px;
      font-weight: $font-weight-semibold;
      line-height: 18px;
      text-align: center;
      border: 2px solid #fff;
    }

    // The arc: an overlay above the page, below the bar so its tabs stay usable
    .arc {
      position: fixed;
      inset: 0;
      z-index: $z-fixed - 1;
    }

    .arc__backdrop {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 100%, rgba($primary-700, 0.28), rgba(20, 12, 16, 0.55) 70%);
      backdrop-filter: blur(3px);
      opacity: 0;
      transition: opacity 220ms ease;
    }

    .arc__title {
      position: absolute;
      left: 0;
      right: 0;
      bottom: calc(64px + env(safe-area-inset-bottom) + 18px);
      margin: 0;
      text-align: center;
      color: #fff;
      font-family: $font-family-display;
      font-size: 1.125rem;
      font-weight: 600;
      opacity: 0;
      transition: opacity 220ms ease 80ms;
    }

    .arc__menu {
      position: absolute;
      left: 50%;
      bottom: calc(64px + env(safe-area-inset-bottom));
      width: 0;
      height: 0;
    }

    // Each item starts at the tapped tab and travels to its place on the arc
    .arc__item {
      position: absolute;
      left: 0;
      top: 0;
      width: 76px;
      margin-left: -38px;
      margin-top: -30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      border: none;
      background: none;
      padding: 0;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      opacity: 0;
      transform: translate(var(--from), 10px) scale(0.3);
      transition: transform 360ms cubic-bezier(0.34, 1.45, 0.64, 1), opacity 200ms ease;
    }

    .arc__bubble {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #fff;
      color: $primary-700;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);

      &--current {
        background: $primary-600;
        color: #fff;
      }

      &--quiet { color: $text-secondary; }

      .badge { top: -2px; right: -2px; }
    }

    .arc__item:active .arc__bubble { transform: scale(0.92); }

    .arc__label {
      max-width: 76px;
      color: #fff;
      font-size: 12px;
      font-weight: $font-weight-semibold;
      line-height: 1.2;
      text-align: center;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
    }

    .arc--shown {
      .arc__backdrop, .arc__title { opacity: 1; }
      .arc__item {
        opacity: 1;
        transform: translate(var(--x), var(--y)) scale(1);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .arc__item { transition: opacity 120ms ease; }
    }
  `]
})
export class BottomNavComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private messages = inject(MessageService);
  private notifications = inject(NotificationService);
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);

  open = signal<number | null>(null);
  shown = signal(false);
  private url = signal(this.router.url);
  private width = signal(typeof window === 'undefined' ? 390 : window.innerWidth);
  private closing?: ReturnType<typeof setTimeout>;

  tabs = computed<NavTab[]>(() => {
    if (!this.auth.isAuthenticated()) {
      return [
        { label: 'Home', icon: 'home', link: '/' },
        { label: 'Vendors', icon: 'store', link: '/services' },
        { label: 'Events', icon: 'party', link: '/events' },
        {
          label: 'Account', icon: 'user', items: [
            { label: 'Log in', icon: 'user', link: '/auth/login' },
            { label: 'Sign up', icon: 'sparkles', link: '/auth/register' },
            { label: 'For vendors', icon: 'briefcase', link: '/for-vendors' }
          ]
        }
      ];
    }
    const user = this.auth.currentUser();
    const vendor = user?.userType === 'helper' || user?.userType === 'all';
    const unreadMessages = this.messages.unreadCount();
    const unreadNotifications = this.notifications.unreadCount();
    const only = <T>(show: boolean, item: T) => (show ? [item] : []);
    return [
      {
        label: 'Explore', icon: 'search', items: [
          { label: 'Home', icon: 'home', link: '/' },
          { label: 'Vendors', icon: 'store', link: '/services' },
          { label: 'Events', icon: 'party', link: '/events' },
          ...only(vendor, { label: 'Find events', icon: 'sparkles', link: '/dashboard/find-events' })
        ]
      },
      {
        label: 'Plan', icon: 'calendar', items: [
          { label: 'Dashboard', icon: 'home', link: '/dashboard' },
          { label: 'My events', icon: 'party', link: '/dashboard/events' },
          { label: 'New event', icon: 'plus', link: '/events/create' },
          { label: 'Bookings', icon: 'clipboard', link: '/bookings' },
          ...only(vendor, { label: 'Calendar', icon: 'calendar', link: '/dashboard/calendar' })
        ]
      },
      {
        label: 'Inbox', icon: 'message', badge: unreadMessages + unreadNotifications, items: [
          { label: 'Messages', icon: 'message', link: '/messages', badge: unreadMessages },
          { label: 'Alerts', icon: 'bell', link: '/notifications', badge: unreadNotifications }
        ]
      },
      {
        label: 'Me', icon: 'user', items: [
          { label: 'Profile', icon: 'settings', link: '/profile' },
          ...only(vendor, { label: 'My services', icon: 'store', link: '/dashboard/my-services' }),
          { label: 'Earnings', icon: 'wallet', link: '/dashboard/earnings' },
          ...only(user?.role === 'admin', { label: 'Admin', icon: 'shield', link: '/admin' }),
          { label: 'Log out', icon: 'log-out', action: 'logout' as const }
        ]
      }
    ];
  });

  // The tab whose page (or one of its sub-pages) is showing
  activeTab = computed(() => {
    const path = this.url().split(/[?#]/)[0];
    const matches = (link: string) => link === '/' ? path === '/' : path === link || path.startsWith(link + '/');
    let best = -1;
    let bestLength = -1;
    this.tabs().forEach((tab, i) => {
      for (const link of [tab.link, ...(tab.items || []).map(item => item.link)]) {
        if (link && matches(link) && link.length > bestLength) {
          best = i;
          bestLength = link.length;
        }
      }
    });
    return best;
  });

  // Where the open tab sits, relative to the centre of the screen
  origin = computed(() => {
    const i = this.open();
    return i === null ? 0 : ((i + 0.5) / 4 - 0.5) * this.width();
  });

  // Sub-pages spread evenly on an arc centred over the bar
  placed = computed<PlacedItem[]>(() => {
    const i = this.open();
    if (i === null) return [];
    const items = this.tabs()[i].items || [];
    const n = items.length;
    const span = Math.min(150, 50 * (n - 1));
    const radius = Math.min(n > 3 ? 160 : 130, this.width() / 2 - 44);
    return items.map((item, k) => {
      const angle = (90 + span / 2 - (n > 1 ? (span * k) / (n - 1) : 0)) * Math.PI / 180;
      return {
        ...item,
        x: Math.round(Math.cos(angle) * radius),
        // Taller than wide, so the arc rises towards the middle of the screen
        y: Math.round(-Math.sin(angle) * radius * (n > 3 ? 1.4 : 1.2) - 40),
        delay: k * 35
      };
    });
  });

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      this.url.set((e as NavigationEnd).urlAfterRedirects);
      this.close();
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.closing));
  }

  ngOnInit(): void {
    // Lets fixed bottom bars on pages (e.g. "Book now") sit above this one
    document.body.classList.add('has-bottom-nav');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('has-bottom-nav');
  }

  @HostListener('window:resize')
  onResize(): void {
    this.width.set(window.innerWidth);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  toggle(i: number, event: Event): void {
    event.stopPropagation();
    if (this.open() === i) {
      this.close();
      return;
    }
    clearTimeout(this.closing);
    this.shown.set(false);
    this.open.set(i);
    // Render at the tab first, then move out so the items animate along the arc
    requestAnimationFrame(() => requestAnimationFrame(() => {
      this.shown.set(true);
      this.host.nativeElement.querySelector('.arc__item')?.focus({ preventScroll: true });
    }));
  }

  close(): void {
    if (this.open() === null) return;
    this.shown.set(false);
    clearTimeout(this.closing);
    this.closing = setTimeout(() => this.open.set(null), OPEN_MS);
  }

  run(item: NavItem): void {
    this.close();
    if (item.action === 'logout') this.auth.logout().subscribe();
  }

  isCurrent(link: string): boolean {
    const path = this.url().split(/[?#]/)[0];
    return link === '/' ? path === '/' : path === link;
  }

  count(n: number): string {
    return n > 99 ? '99+' : String(n);
  }
}
