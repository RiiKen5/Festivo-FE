import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { ToastService } from '../../../core/services/toast.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { Event as FestivoEvent } from '../../../core/models/event.model';

interface Theme { id: string; name: string; bg: [string, string]; ink: string; soft: string; accent: string; }

const THEMES: Theme[] = [
  { id: 'berry', name: 'Berry', bg: ['#fdf2f7', '#f6d9e6'], ink: '#3b1426', soft: '#7a3d59', accent: '#9e3f68' },
  { id: 'sunset', name: 'Sunset', bg: ['#fff4e6', '#ffd6c2'], ink: '#4a1d0c', soft: '#8a4a2b', accent: '#d9480f' },
  { id: 'midnight', name: 'Midnight', bg: ['#1e1b4b', '#312e81'], ink: '#fdf6e3', soft: '#c7c3f0', accent: '#f5c451' },
  { id: 'garden', name: 'Garden', bg: ['#f0faf3', '#cfeedd'], ink: '#123524', soft: '#3e6b55', accent: '#2f855a' }
];

const W = 1080;
const H = 1350;

/**
 * A shareable invitation image for an event (portrait, sized for WhatsApp
 * and Instagram stories): title, date, place, host and a QR code to RSVP.
 * Drawn in the browser, so nothing is uploaded.
 */
@Component({
  selector: 'app-invitation-card',
  standalone: true,
  imports: [ModalComponent, ButtonComponent],
  template: `
    <app-modal [isOpen]="isOpen" title="Invitation card" size="lg" (onClose)="closed.emit()" [showFooter]="true">
      <div class="card-maker">
        <div class="preview">
          @if (imageUrl()) {
            <img [src]="imageUrl()" [alt]="'Invitation card for ' + event?.title">
          } @else {
            <div class="preview__wait">Making your card…</div>
          }
        </div>
        <div class="side">
          <p class="hint">Send this to guests on WhatsApp or post it as a story. The QR code opens the {{ event?.isPublic ? 'event' : 'private invite' }} page where they can RSVP.</p>
          <fieldset class="themes">
            <legend>Colour</legend>
            @for (t of themes; track t.id) {
              <label class="swatch" [class.swatch--on]="theme().id === t.id">
                <input type="radio" name="card-theme" [value]="t.id" [checked]="theme().id === t.id" (change)="setTheme(t)">
                <span class="swatch__dot" [style.background]="'linear-gradient(135deg,' + t.bg[0] + ',' + t.bg[1] + ')'" [style.borderColor]="t.accent"></span>
                {{ t.name }}
              </label>
            }
          </fieldset>
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
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;
    .card-maker { display: grid; gap: $spacing-5; @include md { grid-template-columns: minmax(0, 1fr) 220px; } }
    .preview { aspect-ratio: 4 / 5; border-radius: $radius-lg; overflow: hidden; background: $neutral-100; box-shadow: $shadow-md;
      img { display: block; width: 100%; height: 100%; } }
    .preview__wait { display: grid; place-items: center; height: 100%; color: $text-secondary; font-size: $font-size-sm; }
    .hint { margin: 0 0 $spacing-4; font-size: $font-size-sm; color: $text-secondary; }
    .themes { border: 0; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: $spacing-2;
      legend { margin-bottom: $spacing-2; font-size: $font-size-sm; font-weight: $font-weight-medium; } }
    .swatch { display: inline-flex; align-items: center; gap: $spacing-2; padding: $spacing-1 $spacing-3 $spacing-1 $spacing-1;
      border: 1px solid $border-light; border-radius: $radius-full; font-size: $font-size-sm; cursor: pointer;
      input { position: absolute; opacity: 0; pointer-events: none; }
      &--on { border-color: $primary-600; background: $primary-50; }
      &:focus-within { outline: 2px solid $primary-500; outline-offset: 2px; } }
    .swatch__dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid; }
  `]
})
export class InvitationCardComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() event: FestivoEvent | null = null;
  @Input() hostName = '';
  /** Where the QR code points: the invite link for private events. */
  @Input() link = '';
  @Output() closed = new EventEmitter<void>();

  private toast = inject(ToastService);
  private analytics = inject(AnalyticsService);

  readonly themes = THEMES;
  readonly canShareFiles = typeof navigator !== 'undefined' && !!navigator.canShare &&
    navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] });
  theme = signal<Theme>(THEMES[0]);
  blob = signal<Blob | null>(null);
  imageUrl = signal<string | null>(null);

  ngOnChanges(): void {
    if (this.isOpen && this.event) this.render();
  }

  setTheme(t: Theme): void {
    this.theme.set(t);
    this.render();
  }

  download(): void {
    const blob = this.blob();
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${this.event?.slug || 'invitation'}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    this.analytics.track('invite_shared', { eventId: this.event?._id, channel: 'card_download' });
  }

  async share(): Promise<void> {
    const blob = this.blob();
    if (!blob) return;
    const file = new File([blob], `${this.event?.slug || 'invitation'}.png`, { type: 'image/png' });
    try {
      await navigator.share({ files: [file], title: this.event?.title, text: `You're invited! RSVP here: ${this.link}` });
      this.analytics.track('invite_shared', { eventId: this.event?._id, channel: 'card_share' });
    } catch (err: any) {
      if (err?.name !== 'AbortError') this.toast.error('Could not share', 'Download the card and send it instead.');
    }
  }

  private async render(): Promise<void> {
    const e = this.event;
    if (!e) return;
    const t = this.theme();
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
    g.addColorStop(0, t.bg[0]);
    g.addColorStop(1, t.bg[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = t.accent;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, W - 96, H - 96);
    ctx.globalAlpha = 1;
    this.confetti(ctx, t);

    let y = 150;
    ctx.textAlign = 'center';
    const qrSize = 210;
    const qrY = H - 96 - qrSize - 70;

    // Cover photo, if it can be drawn (images without CORS headers can't)
    const photo = e.coverPhoto ? await this.loadImage(e.coverPhoto) : null;
    if (photo) {
      const pw = 760, ph = 400, px = (W - pw) / 2;
      ctx.save();
      this.roundRect(ctx, px, y, pw, ph, 28);
      ctx.clip();
      const scale = Math.max(pw / photo.width, ph / photo.height);
      ctx.drawImage(photo, px + (pw - photo.width * scale) / 2, y + (ph - photo.height * scale) / 2, photo.width * scale, photo.height * scale);
      ctx.restore();
      y += ph + 70;
    }

    // Lay out the text first so it can be centred in the space left
    const titleSize = photo ? 76 : 92;
    ctx.font = `600 ${titleSize}px Fraunces`;
    const titleLines = this.wrap(ctx, e.title, W - 220).slice(0, 3);
    ctx.font = '400 34px Inter';
    const placeLines = this.wrap(ctx, [e.locationName, e.city].filter(Boolean).join(', '), W - 260).slice(0, 2);
    const blockHeight = 90 + titleLines.length * titleSize * 1.15 + 30 + 58 + placeLines.length * 46 + (this.hostName ? 52 : 0);
    if (!photo) y = Math.max(y, 110 + (qrY - 110 - blockHeight) / 2);

    ctx.fillStyle = t.accent;
    ctx.font = '600 34px Inter';
    this.spaced(ctx, "YOU'RE INVITED", W / 2, y, 6);
    y += 90;

    ctx.fillStyle = t.ink;
    ctx.font = `600 ${titleSize}px Fraunces`;
    for (const line of titleLines) {
      ctx.fillText(line, W / 2, y);
      y += titleSize * 1.15;
    }
    y += 30;

    const date = new Date(e.date);
    ctx.fillStyle = t.ink;
    ctx.font = '600 40px Inter';
    ctx.fillText(date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) + (e.time ? ` · ${this.time(e.time)}` : ''), W / 2, y);
    y += 58;
    ctx.fillStyle = t.soft;
    ctx.font = '400 34px Inter';
    for (const line of placeLines) {
      ctx.fillText(line, W / 2, y);
      y += 46;
    }
    if (this.hostName) {
      y += 6;
      ctx.fillText(`Hosted by ${this.hostName}`, W / 2, y);
    }

    // QR code to RSVP, bottom centre
    if (this.link) {
      const QR = (await import('qrcode')).default;
      const qr = document.createElement('canvas');
      await QR.toCanvas(qr, this.link, { width: qrSize, margin: 1, color: { dark: '#111111', light: '#ffffff' } });
      ctx.fillStyle = '#ffffff';
      this.roundRect(ctx, (W - qrSize) / 2 - 14, qrY - 14, qrSize + 28, qrSize + 28, 20);
      ctx.fill();
      ctx.drawImage(qr, (W - qrSize) / 2, qrY);
      ctx.fillStyle = t.soft;
      ctx.font = '600 28px Inter';
      ctx.fillText('Scan to RSVP', W / 2, qrY + qrSize + 56);
    }

    ctx.fillStyle = t.soft;
    ctx.font = '400 24px Inter';
    ctx.fillText('festivo.paathly.in', W / 2, H - 70);

    canvas.toBlob(b => {
      if (!b) return;
      const old = this.imageUrl();
      if (old) URL.revokeObjectURL(old);
      this.blob.set(b);
      this.imageUrl.set(URL.createObjectURL(b));
    }, 'image/png');
  }

  private loadImage(src: string): Promise<HTMLImageElement | null> {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // A photo without CORS headers would block exporting the card
        try {
          const probe = document.createElement('canvas').getContext('2d')!;
          probe.drawImage(img, 0, 0, 1, 1);
          probe.getImageData(0, 0, 1, 1);
          resolve(img);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  private wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
    const lines: string[] = [];
    let line = '';
    for (const word of (text || '').split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > max && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  private spaced(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, gap: number): void {
    const widths = [...text].map(ch => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (text.length - 1);
    let x = cx - total / 2;
    ctx.textAlign = 'left';
    [...text].forEach((ch, i) => { ctx.fillText(ch, x, y); x += widths[i] + gap; });
    ctx.textAlign = 'center';
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

  // A few soft dots in the corners, same pattern every time
  private confetti(ctx: CanvasRenderingContext2D, t: Theme): void {
    const dots = [[110, 110, 14], [170, 80, 8], [970, 120, 12], [910, 90, 7], [100, 1230, 10], [980, 1240, 14], [160, 1270, 6], [930, 1200, 8]];
    ctx.fillStyle = t.accent;
    ctx.globalAlpha = 0.35;
    for (const [x, y, r] of dots) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private time(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    if (!Number.isFinite(h)) return hhmm;
    return new Date(2000, 0, 1, h, m || 0).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }
}
