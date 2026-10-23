import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<Toast[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  private generateId(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  show(toast: Omit<Toast, 'id'>): void {
    // The error interceptor and the page often report the same failure, and
    // parallel requests can fail together: show each message once
    const duplicate = this.toastsSignal().some(t =>
      t.type === toast.type && (t.message || t.title) === (toast.message || toast.title));
    if (duplicate) return;

    const id = this.generateId();
    const newToast: Toast = { ...toast, id };

    this.toastsSignal.update(toasts => [...toasts, newToast]);

    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(title: string, message?: string): void {
    this.show({ type: 'success', title, message });
  }

  error(title: string, message?: string): void {
    this.show({ type: 'error', title, message, duration: 7000 });
  }

  warning(title: string, message?: string): void {
    this.show({ type: 'warning', title, message });
  }

  info(title: string, message?: string): void {
    this.show({ type: 'info', title, message });
  }

  dismiss(id: string): void {
    this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
  }

  dismissAll(): void {
    this.toastsSignal.set([]);
  }
}
