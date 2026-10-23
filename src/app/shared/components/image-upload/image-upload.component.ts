import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadService } from '../../../core/services/upload.service';
import { ToastService } from '../../../core/services/toast.service';

const MAX_BYTES = 8 * 1024 * 1024;

// Button that uploads chosen image(s) and emits each resulting URL
@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label class="image-upload" [class.image-upload--busy]="uploading() > 0">
      <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" [multiple]="multiple" (change)="onSelect($event)" [disabled]="uploading() > 0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      {{ uploading() > 0 ? 'Uploading ' + uploading() + '…' : label }}
    </label>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;

    .image-upload {
      display: inline-flex;
      align-items: center;
      gap: $spacing-2;
      padding: $spacing-2 $spacing-4;
      border: 1px dashed $primary-400;
      border-radius: $radius-md;
      color: $primary-700;
      background: $primary-50;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      cursor: pointer;
      white-space: nowrap;

      input {
        display: none;
      }

      &--busy {
        opacity: 0.7;
        cursor: progress;
      }
    }
  `]
})
export class ImageUploadComponent {
  private uploads = inject(UploadService);
  private toast = inject(ToastService);

  @Input() label = 'Upload image';
  @Input() multiple = false;
  @Output() uploaded = new EventEmitter<string>();

  uploading = signal(0);

  onSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';

    for (const file of files) {
      if (file.size > MAX_BYTES) {
        this.toast.error('Image too large', `${file.name} is over 8 MB.`);
        continue;
      }
      this.uploading.update(n => n + 1);
      this.uploads.uploadImage(file).subscribe({
        next: (url) => {
          this.uploading.update(n => n - 1);
          this.uploaded.emit(url);
        },
        error: () => this.uploading.update(n => n - 1)
      });
    }
  }
}
