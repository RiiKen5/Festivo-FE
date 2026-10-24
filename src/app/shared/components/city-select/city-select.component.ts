import { Component, ElementRef, EventEmitter, HostListener, Input, Output, booleanAttribute, forwardRef, inject, signal, computed } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { FEATURED_CITIES, INDIAN_CITIES } from '../../data/cities';

let nextId = 0;

/**
 * Searchable city dropdown (ARIA combobox). Popular cities show first; a
 * town that isn't listed can still be used. Works with formControlName and
 * ngModel; the value is the city name, or '' for "any city" in filters.
 */
@Component({
  selector: 'app-city-select',
  standalone: true,
  imports: [IconComponent],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CitySelectComponent), multi: true }],
  template: `
    <div class="city" [class.city--error]="error" [class.city--compact]="compact">
      @if (label) {
        <label class="city__label" [for]="id">{{ label }}@if (required) {<span class="city__req" aria-hidden="true">*</span>}</label>
      }
      <div class="city__box">
        <app-icon name="map-pin" [size]="16" class="city__pin"></app-icon>
        <input
          [id]="id"
          type="text"
          role="combobox"
          [attr.aria-label]="label ? null : (ariaLabel || 'City')"
          autocomplete="off"
          aria-autocomplete="list"
          [attr.aria-expanded]="open()"
          [attr.aria-controls]="id + '-list'"
          [attr.aria-activedescendant]="open() && active() >= 0 ? id + '-opt-' + active() : null"
          [attr.aria-invalid]="error ? true : null"
          [attr.aria-required]="required || null"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [value]="query()"
          (input)="onType($any($event.target).value)"
          (focus)="openList()"
          (click)="openList()"
          (keydown)="onKey($event)"
          (blur)="onBlur()">
        <app-icon name="chevron-down" [size]="16" class="city__chev"></app-icon>
      </div>
      @if (open()) {
        <ul class="city__list" role="listbox" [id]="id + '-list'" [attr.aria-label]="label || 'Cities'">
          @for (opt of options(); track opt.value + opt.label; let i = $index) {
            <li role="option" [id]="id + '-opt-' + i" [attr.aria-selected]="i === active()"
                [class.city__opt--active]="i === active()" [class.city__opt--hint]="opt.hint"
                (mousedown)="$event.preventDefault(); choose(opt.value)" (mousemove)="active.set(i)">
              {{ opt.label }}
            </li>
          }
          @if (options().length === 0) {
            <li class="city__none" role="presentation">No matching city</li>
          }
        </ul>
      }
      @if (error) { <span class="city__error">{{ error }}</span> }
      @else if (hint) { <span class="city__hint">{{ hint }}</span> }
    </div>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    @use '../../../../styles/mixins' as *;

    :host { display: block; }
    .city { position: relative; width: 100%; }
    .city__label { @include form-label; }
    .city__req { color: $error; margin-left: 2px; }
    .city__box { position: relative; display: flex; align-items: center;
      input { @include input-base; @include input-md; padding-left: $spacing-10; padding-right: $spacing-10; } }
    .city--compact .city__box input { @include input-sm; padding-left: $spacing-8; padding-right: $spacing-8; }
    .city__pin, .city__chev { position: absolute; color: $text-muted; pointer-events: none; }
    .city__pin { left: $spacing-3; }
    .city__chev { right: $spacing-3; }
    .city__list { position: absolute; z-index: 30; left: 0; right: 0; top: calc(100% + 4px); max-height: 260px; overflow-y: auto;
      margin: 0; padding: $spacing-1 0; list-style: none; background: $bg-primary; border: 1px solid $border-light;
      border-radius: $radius-default; box-shadow: $shadow-md;
      li { padding: $spacing-2 $spacing-4; font-size: $font-size-sm; cursor: pointer; } }
    .city__opt--active { background: $primary-50; color: $primary-800; }
    .city__opt--hint { color: $text-secondary; font-style: italic; }
    .city__none { color: $text-muted; cursor: default; }
    .city__error { @include form-error; display: block; }
    .city__hint { @include form-hint; display: block; }
    .city--error input { border-color: $error; }
  `]
})
export class CitySelectComponent implements ControlValueAccessor {
  @Input() label = '';
  /** Accessible name when there is no visible label (e.g. filter bars). */
  @Input() ariaLabel = '';
  @Input() placeholder = 'Search city';
  @Input() hint = '';
  @Input() error = '';
  @Input({ transform: booleanAttribute }) required = false;
  /** Adds an "Any city" option (value '') for filters. */
  @Input({ transform: booleanAttribute }) allowAny = false;
  @Input({ transform: booleanAttribute }) compact = false;
  @Output() cityChange = new EventEmitter<string>();

  private host = inject(ElementRef);
  readonly id = `city-${++nextId}`;
  disabled = false;

  query = signal('');
  open = signal(false);
  active = signal(-1);
  private value = '';

  options = computed(() => {
    const q = this.query().trim().toLowerCase();
    const list: { label: string; value: string; hint?: boolean }[] = [];
    if (this.allowAny && !q) list.push({ label: 'Any city', value: '' });
    const names = q
      ? INDIAN_CITIES.filter(c => c.toLowerCase().includes(q))
          .sort((a, b) => Number(!a.toLowerCase().startsWith(q)) - Number(!b.toLowerCase().startsWith(q)))
      : [...FEATURED_CITIES, ...INDIAN_CITIES.filter(c => !FEATURED_CITIES.includes(c))];
    list.push(...names.slice(0, 50).map(c => ({ label: c, value: c })));
    const typed = this.query().trim();
    if (typed && !INDIAN_CITIES.some(c => c.toLowerCase() === typed.toLowerCase())) {
      list.push({ label: `Use "${typed}"`, value: typed, hint: true });
    }
    return list;
  });

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: string | null): void {
    this.value = v || '';
    this.query.set(this.value);
  }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.disabled = d; }

  openList(): void {
    if (this.disabled) return;
    this.open.set(true);
    this.active.set(this.options().findIndex(o => o.value === this.value));
  }

  onType(text: string): void {
    this.query.set(text);
    this.open.set(true);
    this.active.set(text.trim() ? 0 : -1);
    // Clearing the box in a filter means "any city"
    if (!text.trim() && this.allowAny) this.commit('');
  }

  onKey(e: KeyboardEvent): void {
    const n = this.options().length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!this.open()) return this.openList();
      this.active.set(Math.min(n - 1, this.active() + 1));
      this.scrollActive();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.active.set(Math.max(0, this.active() - 1));
      this.scrollActive();
    } else if (e.key === 'Enter' && this.open()) {
      const opt = this.options()[this.active()];
      if (opt) { e.preventDefault(); this.choose(opt.value); }
    } else if (e.key === 'Escape' && this.open()) {
      e.preventDefault();
      this.close();
    }
  }

  choose(value: string): void {
    this.commit(value);
    this.close();
  }

  onBlur(): void {
    this.onTouched();
    // Typed an exact city name without picking it: accept it
    const typed = this.query().trim();
    const exact = INDIAN_CITIES.find(c => c.toLowerCase() === typed.toLowerCase());
    if (exact && exact !== this.value) this.commit(exact);
    setTimeout(() => this.close(), 0);
  }

  @HostListener('document:mousedown', ['$event'])
  onOutside(e: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(e.target)) this.close();
  }

  private close(): void {
    this.open.set(false);
    this.query.set(this.value);
  }

  private commit(value: string): void {
    this.value = value;
    this.query.set(value);
    this.onChange(value);
    this.cityChange.emit(value);
  }

  private scrollActive(): void {
    setTimeout(() => this.host.nativeElement.querySelector(`#${this.id}-opt-${this.active()}`)?.scrollIntoView({ block: 'nearest' }));
  }
}
