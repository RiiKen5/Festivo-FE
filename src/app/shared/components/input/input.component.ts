import { Component, Input, Output, EventEmitter, forwardRef, booleanAttribute } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
export type InputSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  template: `
    <div class="input-wrapper" [class.input-wrapper--error]="error" [class.input-wrapper--disabled]="disabled">
      @if (label) {
        <label class="input-label" [for]="inputId">
          {{ label }}
          @if (required) {
            <span class="input-required">*</span>
          }
        </label>
      }
      <div class="input-container" [class]="'input-container--' + size">
        @if (prefixIcon) {
          <span class="input-icon input-icon--prefix">{{ prefixIcon }}</span>
        }
        <input
          [id]="inputId"
          [type]="showPassword ? 'text' : type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readonly]="readonly"
          [value]="value"
          [autocomplete]="autocomplete"
          (input)="onInputChange($event)"
          (blur)="onBlur()"
          (focus)="onFocus.emit($event)"
          class="input-field"
        />
        @if (type === 'password') {
          <button type="button" class="input-toggle" (click)="togglePassword()">
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </button>
        }
        @if (suffixIcon && type !== 'password') {
          <span class="input-icon input-icon--suffix">{{ suffixIcon }}</span>
        }
        @if (clearable && value) {
          <button type="button" class="input-clear" (click)="clearInput()">×</button>
        }
      </div>
      @if (error) {
        <span class="input-error">{{ error }}</span>
      }
      @if (hint && !error) {
        <span class="input-hint">{{ hint }}</span>
      }
    </div>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;

    .input-wrapper {
      width: 100%;
    }

    .input-label {
      @include form-label;
    }

    .input-required {
      color: $error;
      margin-left: 2px;
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;

      &--sm .input-field {
        @include input-sm;
      }

      &--md .input-field {
        @include input-md;
      }

      &--lg .input-field {
        @include input-lg;
      }
    }

    .input-field {
      @include input-base;
      padding-left: $spacing-4;
      padding-right: $spacing-4;

      .input-icon--prefix + & {
        padding-left: $spacing-10;
      }
    }

    .input-icon {
      position: absolute;
      color: $text-muted;
      pointer-events: none;
      display: flex;
      align-items: center;

      &--prefix {
        left: $spacing-3;
      }

      &--suffix {
        right: $spacing-3;
      }
    }

    .input-toggle,
    .input-clear {
      position: absolute;
      right: $spacing-3;
      background: none;
      border: none;
      cursor: pointer;
      color: $text-muted;
      padding: $spacing-1;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color $transition-fast;

      &:hover {
        color: $text-secondary;
      }
    }

    .input-error {
      @include form-error;
    }

    .input-hint {
      @include form-hint;
    }

    .input-wrapper--error {
      .input-field {
        border-color: $error;

        &:focus {
          border-color: $error;
          box-shadow: 0 0 0 3px rgba($error, 0.1);
        }
      }
    }

    .input-wrapper--disabled {
      opacity: 0.6;

      .input-field {
        cursor: not-allowed;
        background: $neutral-100;
      }
    }
  `]
})
export class InputComponent implements ControlValueAccessor {
  @Input() type: InputType = 'text';
  @Input() size: InputSize = 'md';
  @Input() label?: string;
  @Input() placeholder = '';
  @Input() hint?: string;
  @Input() error?: string;
  @Input({ transform: booleanAttribute }) disabled = false;
  @Input({ transform: booleanAttribute }) readonly = false;
  @Input({ transform: booleanAttribute }) required = false;
  @Input({ transform: booleanAttribute }) clearable = false;
  @Input() prefixIcon?: string;
  @Input() suffixIcon?: string;
  @Input() autocomplete = 'off';

  @Output() onFocus = new EventEmitter<FocusEvent>();

  value = '';
  showPassword = false;
  inputId = `input-${Math.random().toString(36).substr(2, 9)}`;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  clearInput(): void {
    this.value = '';
    this.onChange('');
  }
}
