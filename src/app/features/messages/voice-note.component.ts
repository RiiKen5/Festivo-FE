import { Component, Input, OnDestroy, inject, signal } from '@angular/core';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { MessageService } from '../../core/services/message.service';

/** Play button and length for a voice message; audio loads on first play. */
@Component({
  selector: 'app-voice-note',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="voice">
      <button type="button" class="voice__btn" (click)="toggle()" [attr.aria-label]="playing() ? 'Pause voice message' : 'Play voice message'" [disabled]="failed()">
        @if (loading()) { <span class="voice__spin" aria-hidden="true"></span> }
        @else { <app-icon [name]="playing() ? 'pause' : 'play'" [size]="16"></app-icon> }
      </button>
      <span class="voice__bar" aria-hidden="true"><span [style.width.%]="progress()"></span></span>
      <span class="voice__time">{{ failed() ? 'Unavailable' : clock(playing() || progress() ? current() : duration()) }}</span>
    </div>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    .voice { display: flex; align-items: center; gap: $spacing-2; min-width: 190px; }
    .voice__btn { display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; border: 0; border-radius: 50%;
      background: $primary-600; color: $text-inverse; cursor: pointer;
      &:disabled { opacity: 0.5; cursor: default; } }
    :host-context(.bubble--mine) .voice__btn { background: $bg-primary; color: $primary-600; }
    .voice__spin { width: 14px; height: 14px; border: 2px solid $bg-primary; border-top-color: transparent; border-radius: 50%;
      animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .voice__bar { flex: 1; height: 4px; border-radius: 2px; background: currentColor; opacity: 0.35; overflow: hidden;
      span { display: block; height: 100%; background: currentColor; } }
    .voice__time { font-size: 12px; font-variant-numeric: tabular-nums; }
  `]
})
export class VoiceNoteComponent implements OnDestroy {
  @Input({ required: true }) set src(path: string) {
    this.path = path;
    const d = Number(new URLSearchParams(path.split('?')[1] || '').get('d'));
    this.duration.set(Number.isFinite(d) ? d : 0);
  }

  private messages = inject(MessageService);
  private path = '';
  private audio?: HTMLAudioElement;
  private objectUrl?: string;

  duration = signal(0);
  current = signal(0);
  progress = signal(0);
  playing = signal(false);
  loading = signal(false);
  failed = signal(false);

  toggle(): void {
    if (this.audio) {
      this.playing() ? this.audio.pause() : this.audio.play();
      return;
    }
    this.loading.set(true);
    this.messages.getVoice(this.path).subscribe({
      next: blob => {
        this.objectUrl = URL.createObjectURL(blob);
        const audio = new Audio(this.objectUrl);
        audio.onplay = () => this.playing.set(true);
        audio.onpause = () => this.playing.set(false);
        audio.onended = () => { this.playing.set(false); this.progress.set(0); this.current.set(0); };
        audio.ontimeupdate = () => {
          this.current.set(audio.currentTime);
          const total = isFinite(audio.duration) ? audio.duration : this.duration();
          this.progress.set(total ? Math.min(100, audio.currentTime / total * 100) : 0);
        };
        this.audio = audio;
        this.loading.set(false);
        audio.play().catch(() => this.failed.set(true));
      },
      error: () => { this.loading.set(false); this.failed.set(true); }
    });
  }

  clock(sec: number): string {
    const s = Math.max(0, Math.round(sec));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  ngOnDestroy(): void {
    this.audio?.pause();
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
  }
}
