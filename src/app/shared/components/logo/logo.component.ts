import { Component, Input } from '@angular/core';

// Compact brand mark for UI chrome: the serif "F" monogram from the Festivo
// logo, plus the wordmark. The full lockup (assets/images/logo.svg) is too
// detailed to read at navbar size.
@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <span class="logo" [class.logo--inverse]="inverse">
      <svg class="logo__mark" [attr.width]="size" [attr.height]="size" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="19" fill="currentColor"/>
        <circle cx="20" cy="20" r="15.5" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-dasharray="1.2 2.4"/>
        <text x="20" y="27.5" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="21" fill="#fff">F</text>
      </svg>
      @if (wordmark) {
        <span class="logo__word">Festivo</span>
      }
    </span>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;

    .logo {
      display: inline-flex;
      align-items: center;
      gap: $spacing-2;
      color: $primary-600;
    }

    .logo__word {
      font-family: $font-family-display;
      font-size: 1.375rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: $neutral-900;
    }

    .logo--inverse {
      color: #fff;

      .logo__mark text { fill: $primary-700; }
      .logo__mark circle:last-of-type { stroke: $primary-700; }
      .logo__word { color: #fff; }
    }
  `]
})
export class LogoComponent {
  @Input() size = 32;
  @Input() wordmark = true;
  @Input() inverse = false;
}
