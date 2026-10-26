import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AttributionService } from './attribution.service';

export type AnalyticsEvent =
  | 'signup_started'
  | 'signup_completed'
  | 'event_created'
  | 'service_created'
  | 'booking_requested'
  | 'booking_confirmed'
  | 'booking_problem_reported'
  | 'payment_completed'
  | 'rsvp_created'
  | 'ticket_purchased'
  | 'invite_shared'
  | 'listing_shared'
  | 'vendor_cta_clicked'
  | 'host_cta_clicked';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Product analytics behind one small interface. Sends to Google Analytics 4
 * when `gaMeasurementId` is set in the environment, and does nothing
 * otherwise, so screens can call track() without caring whether analytics is
 * configured. Event names and parameters are documented in
 * docs/analytics-event-taxonomy.md.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private attribution = inject(AttributionService);
  private measurementId = '';

  init(): void {
    const env = environment as { gaMeasurementId?: string };
    if (!env.gaMeasurementId || window.gtag) return;
    this.measurementId = env.gaMeasurementId;

    window.dataLayer = window.dataLayer || [];
    // gtag.js reads the arguments object, so this must not be an arrow function
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    // Page views are sent on each route change instead of only on first load
    window.gtag('config', this.measurementId, { send_page_view: false });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.measurementId)}`;
    document.head.appendChild(script);
  }

  track(event: AnalyticsEvent, params: Record<string, unknown> = {}): void {
    this.gtag('event', event, params);
  }

  page(path: string): void {
    this.gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.origin + path,
      page_title: document.title
    });
  }

  identify(user: { _id: string; userType?: string; city?: string; createdAt?: string | Date }): void {
    const first = this.attribution.get();
    this.gtag('config', this.measurementId, { user_id: user._id, send_page_view: false });
    this.gtag('set', 'user_properties', {
      user_type: user.userType,
      city: user.city,
      first_source: first?.source,
      first_campaign: first?.campaign
    });
  }

  reset(): void {
    this.gtag('config', this.measurementId, { user_id: null, send_page_view: false });
  }

  private gtag(...args: unknown[]): void {
    if (!this.measurementId || !window.gtag) return;
    try { window.gtag(...args); } catch { /* never break the app for analytics */ }
  }
}
