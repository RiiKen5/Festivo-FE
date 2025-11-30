import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  template: `
    <div class="not-found">
      <div class="not-found__content">
        <span class="not-found__icon">🎭</span>
        <h1 class="not-found__title">404</h1>
        <h2 class="not-found__subtitle">Page not found</h2>
        <p class="not-found__desc">
          Oops! The page you're looking for seems to have wandered off to a party somewhere else.
        </p>
        <div class="not-found__actions">
          <app-button routerLink="/">Back to Home</app-button>
          <app-button routerLink="/events" variant="secondary">Explore Events</app-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .not-found {
      min-height: 100vh;
      @include flex-center;
      background: $bg-secondary;
      padding: $spacing-6;
    }

    .not-found__content {
      text-align: center;
      max-width: 480px;
    }

    .not-found__icon {
      font-size: 6rem;
      display: block;
      margin-bottom: $spacing-4;
    }

    .not-found__title {
      font-size: 8rem;
      font-weight: $font-weight-extrabold;
      background: $bg-gradient-hero;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: $spacing-2;
    }

    .not-found__subtitle {
      font-size: $font-size-2xl;
      font-weight: $font-weight-semibold;
      margin-bottom: $spacing-4;
    }

    .not-found__desc {
      color: $text-secondary;
      margin-bottom: $spacing-8;
    }

    .not-found__actions {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: $spacing-4;
    }
  `]
})
export class NotFoundComponent {}
