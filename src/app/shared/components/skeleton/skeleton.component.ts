import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="skeleton"
      [class.skeleton--circle]="variant === 'circle'"
      [class.skeleton--text]="variant === 'text'"
      [class.skeleton--rect]="variant === 'rect'"
      [class.skeleton--card]="variant === 'card'"
      [style.width]="width"
      [style.height]="height"
      [style.border-radius]="borderRadius"
    ></div>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;

    .skeleton {
      background: linear-gradient(
        90deg,
        $neutral-200 0%,
        $neutral-100 50%,
        $neutral-200 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .skeleton--text {
      height: 1em;
      border-radius: $radius-sm;
      margin-bottom: 0.5em;
    }

    .skeleton--circle {
      border-radius: 50%;
    }

    .skeleton--rect {
      border-radius: $radius-default;
    }

    .skeleton--card {
      border-radius: $radius-lg;
      min-height: 200px;
    }
  `]
})
export class SkeletonComponent {
  @Input() variant: 'text' | 'circle' | 'rect' | 'card' = 'text';
  @Input() width = '100%';
  @Input() height = '';
  @Input() borderRadius = '';
}
