import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ToastService } from '../../../../core/services/toast.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { Service } from '../../../../core/models/service.model';

const W = 1080;
const H = 1350;
const BERRY = '#9e3f68';
const INK = '#3b1426';
const SOFT = '#7a3d59';

const CATEGORY: Record<string, string> = {
  food: 'Cakes & food', decor: 'Decoration', photography: 'Photography', music: 'Music & DJ',
  cleanup: 'Cleanup', entertainment: 'Entertainment', venue: 'Venue', other: 'Event services'
};

/**
 * A QR card for a vendor's shop counter, stall or Instagram story. The QR
 * opens the vendor's own booking link, so customers it brings count as theirs.
 * Drawn in the browser, so nothing is uploaded.
 */
@Component({
  selector: 'app-shop-card',
  standalone: true,
  imports: [ModalComponent, ButtonComponent],
  template: `
    <app-modal [isOpen]="isOpen" title="QR card for your shop" size="lg" (onClose)="closed.emit()" [showFooter]="true">
      <div class="card-maker">
        <div class="preview">
          @if (imageUrl()) {
            <img [src]="imageUrl()" [alt]="'QR card for ' + service?.serviceName">
          } @else {
            <div class="preview__wait">Making your card…</div>
          }
        </div>
        <div class="side">
          <p class="hint">Print it for your counter or stall, or post it as a story. Customers scan it to see your prices and book you.</p>
          <p class="hint">Bookings from this QR code count as <strong>your own customers</strong>, so they get the lower fee.</p>
        </div>
      </div>
      <div modal-footer>
        <app-button variant="secondary" [disabled]="!blob()" (onClick)="download()">Download</app-button>
        @if (canShareFiles) {
          <app-button [disabled]="!blob()" (onClick)="share()">Share</app-button>
        }
      </div>
    </app-modal>
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;
    .card-maker { display: grid; gap: $spacing-5; @include md { grid-template-columns: minmax(0, 1fr) 220px; } }
    .preview { aspect-ratio: 4 / 5; border-radius: $radius-lg; overflow: hidden; background: $neutral-100; box-shadow: $shadow-md;
      img { display: block; width: 100%; height: 100%; } }
    .preview__wait { display: grid; place-items: center; height: 100%; color: $text-secondary; font-size: $font-size-sm; }
    .hint { margin: 0 0 $spacing-3; font-size: $font-size-sm; color: $text-secondary; }
  `]
})
export class ShopCardComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() service: Service | null = null;
  /** The vendor's tagged booking link the QR code opens. */
  @Input() link = '';
  @Output() closed = new EventEmitter<void>();

  private toast = inject(ToastService);
  private analytics = inject(AnalyticsService);

  readonly canShareFiles = typeof navigator !== 'undefined' && !!navigator.canShare &&
    navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] });
  blob = signal<Blob | null>(null);
  imageUrl = signal<string | null>(null);

  ngOnChanges(): void {
    if (this.isOpen && this.service) this.render();
  }

  private get fileName(): string {
    return `${this.service?.slug || 'yaay'}-qr.png`;
  }

  download(): void {
    const blob = this.blob();
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = this.fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    this.analytics.track('listing_shared', { serviceId: this.service?._id, channel: 'qr_card_download', own: true });
  }

  async share(): Promise<void> {
    const blob = this.blob();
    if (!blob) return;
    const file = new File([blob], this.fileName, { type: 'image/png' });
    try {
      await navigator.share({ files: [file], title: this.service?.serviceName, text: `Book ${this.service?.serviceName} on Yaay: ${this.link}` });
      this.analytics.track('listing_shared', { serviceId: this.service?._id, channel: 'qr_card_share', own: true });
    } catch (err: any) {
      if (err?.name !== 'AbortError') this.toast.error('Could not share', 'Download the card and send it instead.');
    }
  }

  private async render(): Promise<void> {
    const s = this.service;
    if (!s || !this.link) return;
    this.blob.set(null);

    await Promise.all([
      document.fonts.load('600 80px Fraunces'),
      document.fonts.load('600 40px Inter'),
      document.fonts.load('400 34px Inter')
    ]).catch(() => {});

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // Background and frame
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#fdf2f7');
    g.addColorStop(1, '#f6d9e6');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = BERRY;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, W - 96, H - 96);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';

    let y = 170;
    ctx.fillStyle = BERRY;
    ctx.font = '600 34px Inter';
    this.spaced(ctx, (CATEGORY[s.category] || CATEGORY['other']).toUpperCase(), W / 2, y, 6);
    y += 100;

    ctx.fillStyle = INK;
    ctx.font = '600 84px Fraunces';
    const titleLines = this.wrap(ctx, s.serviceName, W - 220).slice(0, 2);
    for (const line of titleLines) {
      ctx.fillText(line, W / 2, y);
      y += 96;
    }

    ctx.fillStyle = SOFT;
    ctx.font = '400 36px Inter';
    const from = `From ₹${s.basePrice.toLocaleString('en-IN')}`;
    const area = s.serviceAreas?.length ? s.serviceAreas.slice(0, 2).join(', ') : s.city;
    ctx.fillText([from, area].filter(Boolean).join(' · '), W / 2, y + 6);

    // The QR code, large enough to scan from across a counter
    const qrSize = 520;
    const qrY = 560;
    const QR = (await import('qrcode')).default;
    const qr = document.createElement('canvas');
    await QR.toCanvas(qr, this.link, { width: qrSize, margin: 1, color: { dark: '#111111', light: '#ffffff' } });
    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, (W - qrSize) / 2 - 24, qrY - 24, qrSize + 48, qrSize + 48, 28);
    ctx.fill();
    ctx.drawImage(qr, (W - qrSize) / 2, qrY);

    ctx.fillStyle = INK;
    ctx.font = '600 44px Inter';
    ctx.fillText('Scan to see prices and book', W / 2, qrY + qrSize + 110);

    ctx.fillStyle = SOFT;
    ctx.font = '400 28px Inter';
    ctx.fillText('yaay.paathly.in', W / 2, H - 80);

    canvas.toBlob(b => {
      if (!b) return;
      const old = this.imageUrl();
      if (old) URL.revokeObjectURL(old);
      this.blob.set(b);
      this.imageUrl.set(URL.createObjectURL(b));
    }, 'image/png');
  }

  private wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    let line = '';
    for (const word of text.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  private spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number): void {
    const widths = [...text].map(ch => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1);
    let cx = x - total / 2;
    ctx.save();
    ctx.textAlign = 'left';
    [...text].forEach((ch, i) => {
      ctx.fillText(ch, cx, y);
      cx += widths[i] + spacing;
    });
    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
