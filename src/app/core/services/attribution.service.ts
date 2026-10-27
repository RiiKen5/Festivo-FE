import { Injectable } from '@angular/core';

export interface Acquisition {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  ref?: string;
  referrer?: string;
  landingPage?: string;
  firstSeenAt?: string;
}

const KEY = 'festivo_first_touch';
const VENDOR_KEY = 'festivo_vendor_touch';
const VENDOR_TOUCH_DAYS = 90;

/**
 * Remembers how a visitor first reached Festivo (UTM tags, ?ref=, the
 * referring site and landing page) so it can be attached to their signup.
 * First touch wins: later visits never overwrite it.
 */
@Injectable({ providedIn: 'root' })
export class AttributionService {
  private memory: Acquisition | null = null;

  capture(): void {
    if (this.get()) return;
    const params = new URLSearchParams(window.location.search);
    const touch: Acquisition = {
      source: params.get('utm_source') || undefined,
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
      content: params.get('utm_content') || undefined,
      term: params.get('utm_term') || undefined,
      ref: params.get('ref') || undefined,
      referrer: this.externalReferrer(),
      landingPage: window.location.pathname,
      firstSeenAt: new Date().toISOString()
    };
    if (!touch.source && touch.referrer) {
      touch.source = this.sourceFromReferrer(touch.referrer);
      touch.medium = touch.medium || 'referral';
    }
    this.memory = touch;
    try { localStorage.setItem(KEY, JSON.stringify(touch)); } catch { /* storage blocked */ }
  }

  get(): Acquisition | null {
    if (this.memory) return this.memory;
    try {
      const raw = localStorage.getItem(KEY);
      this.memory = raw ? JSON.parse(raw) : null;
    } catch {
      this.memory = null;
    }
    return this.memory;
  }

  /**
   * Remember how this visitor first reached a vendor: through the vendor's
   * own shared link, or by finding them on Festivo. First visit wins, for 90
   * days. It sets Festivo's fee on the vendor (lower on their own customers).
   */
  noteVendorVisit(vendorId: string): void {
    const all = this.vendorVisits();
    const known = all[vendorId];
    if (known && Date.now() - known.at < VENDOR_TOUCH_DAYS * 86400000) return;
    const viaLink = new URLSearchParams(window.location.search).get('utm_source') === 'vendor_share';
    all[vendorId] = { viaLink, at: Date.now() };
    try { localStorage.setItem(VENDOR_KEY, JSON.stringify(all)); } catch { /* storage blocked */ }
  }

  cameViaVendorLink(vendorId: string | undefined): boolean {
    return !!vendorId && this.vendorVisits()[vendorId]?.viaLink === true;
  }

  private vendorVisits(): Record<string, { viaLink: boolean; at: number }> {
    try { return JSON.parse(localStorage.getItem(VENDOR_KEY) || '{}'); } catch { return {}; }
  }

  /** A link to a Festivo page tagged so signups from it can be counted. */
  tagged(url: string, source: string, medium: string, campaign?: string): string {
    const u = new URL(url, window.location.origin);
    u.searchParams.set('utm_source', source);
    u.searchParams.set('utm_medium', medium);
    if (campaign) u.searchParams.set('utm_campaign', campaign);
    return u.toString();
  }

  private externalReferrer(): string | undefined {
    if (!document.referrer) return undefined;
    try {
      const ref = new URL(document.referrer);
      return ref.host === window.location.host ? undefined : `${ref.origin}${ref.pathname}`;
    } catch {
      return undefined;
    }
  }

  private sourceFromReferrer(referrer: string): string {
    const host = new URL(referrer).hostname.replace(/^www\.|^l\.|^m\.|^lm\./, '');
    if (/google\./.test(host)) return 'google';
    if (/instagram\.com/.test(host)) return 'instagram';
    if (/facebook\.com|fb\.com/.test(host)) return 'facebook';
    if (/whatsapp\.com|wa\.me/.test(host)) return 'whatsapp';
    return host;
  }
}
