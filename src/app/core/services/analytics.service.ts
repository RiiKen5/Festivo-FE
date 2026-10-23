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
  | 'payment_completed'
  | 'rsvp_created'
  | 'ticket_purchased'
  | 'invite_shared'
  | 'listing_shared'
  | 'vendor_cta_clicked'
  | 'host_cta_clicked';

/**
 * Product analytics behind one small interface. Sends to PostHog when
 * `posthogKey` is set in the environment, and does nothing otherwise, so
 * screens can call track() without caring whether analytics is configured.
 * Event names and properties are documented in docs/analytics-event-taxonomy.md.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private attribution = inject(AttributionService);
  private client: any = null;
  private enabled = false;
  private queue: Array<(client: any) => void> = [];

  init(): void {
    const env = environment as { posthogKey?: string; posthogHost?: string };
    if (!env.posthogKey) return;
    this.enabled = true;
    import('posthog-js').then(({ default: posthog }) => {
      posthog.init(env.posthogKey!, {
        api_host: env.posthogHost || 'https://us.i.posthog.com',
        capture_pageview: false,
        persistence: 'localStorage+cookie',
        person_profiles: 'identified_only'
      });
      this.client = posthog;
      this.queue.splice(0).forEach(run => run(posthog));
    }).catch(() => { this.enabled = false; this.queue = []; });
  }

  track(event: AnalyticsEvent, properties: Record<string, unknown> = {}): void {
    this.run(client => client.capture(event, properties));
  }

  page(path: string): void {
    this.run(client => client.capture('$pageview', { $current_url: window.location.origin + path }));
  }

  identify(user: { _id: string; userType?: string; city?: string; createdAt?: string | Date }): void {
    const first = this.attribution.get();
    this.run(client => client.identify(user._id, {
      userType: user.userType,
      city: user.city
    }, {
      firstSource: first?.source,
      firstCampaign: first?.campaign,
      signedUpAt: user.createdAt
    }));
  }

  reset(): void {
    this.run(client => client.reset());
  }

  private run(action: (client: any) => void): void {
    if (!this.enabled) return;
    if (this.client) {
      try { action(this.client); } catch { /* never break the app for analytics */ }
    } else if (this.queue.length < 50) {
      this.queue.push(action);
    }
  }
}
