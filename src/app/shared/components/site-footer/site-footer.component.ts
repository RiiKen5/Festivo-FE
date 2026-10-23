import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterModule, LogoComponent],
  template: `
    <footer class="footer">
      <div class="footer__wrap">
      <div class="footer__inner">
        <div class="footer__brand">
          <app-logo [size]="26"></app-logo>
          <p>Book trusted local vendors, sell tickets and invite guests, with payments held safely until the job is done.</p>
        </div>
        <nav class="footer__links" aria-label="Footer">
          <div>
            <h2>Explore</h2>
            <a routerLink="/events">Events</a>
            <a routerLink="/services">Vendors</a>
            <a routerLink="/auth/register">Create an account</a>
          </div>
          <div>
            <h2>Help</h2>
            <a routerLink="/contact">Contact us</a>
            <a routerLink="/refund-policy">Cancellations &amp; refunds</a>
          </div>
          <div>
            <h2>Legal</h2>
            <a routerLink="/terms">Terms of service</a>
            <a routerLink="/privacy">Privacy policy</a>
          </div>
        </nav>
      </div>
      <div class="footer__bottom">© {{ year }} Festivo</div>
      </div>
    </footer>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;

    .footer {
      margin-top: $spacing-16;
      border-top: 1px solid $border-light;
      background: $bg-primary;
    }

    .footer__wrap {
      @include container;
    }

    .footer__inner {
      display: grid;
      gap: $spacing-8;
      padding: $spacing-10 0 $spacing-8;

      @include md {
        grid-template-columns: 1.2fr 2fr;
      }
    }

    .footer__brand p {
      margin: $spacing-3 0 0;
      max-width: 340px;
      font-size: $font-size-sm;
      color: $text-secondary;
    }

    .footer__links {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: $spacing-6;

      h2 {
        margin-bottom: $spacing-3;
        font-size: $font-size-xs;
        font-weight: $font-weight-semibold;
        color: $text-tertiary;
        text-transform: uppercase;
        letter-spacing: $letter-spacing-wider;
      }

      a {
        display: block;
        padding: $spacing-1 0;
        font-size: $font-size-sm;
        color: $text-secondary;

        &:hover {
          color: $text-primary;
        }
      }
    }

    .footer__bottom {
      padding: $spacing-4 0 $spacing-6;
      border-top: 1px solid $border-light;
      font-size: $font-size-xs;
      color: $text-tertiary;
    }
  `]
})
export class SiteFooterComponent {
  year = new Date().getFullYear();
}
