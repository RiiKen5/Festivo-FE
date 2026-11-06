import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import site from '../seo/site.json';
import { Service } from '../models/service.model';
import { Event } from '../models/event.model';
import { categoryLabel, eventTypeLabel } from '../../shared/components/listing-cards/listing-format';

export interface PageSeo {
  title: string;
  description: string;
  // Canonical path; null for pages that have no canonical URL (private, not found)
  path: string | null;
  image?: string | null;
  type?: 'website' | 'article';
  noindex?: boolean;
}

export const SITE_URL = site.siteUrl;
// Render serves a pre-rendered page (dir/index.html) only at "/dir/", so the
// canonical URL of every page, and the links people share, end in a slash
export const pageUrl = (path: string) => SITE_URL + (path.endsWith('/') ? path : path + '/');
const PAGES = new Map(site.pages.map(p => [p.path, p]));
// Vendor and event pages set their own tags once the listing has loaded
const DETAIL_PAGE = /^\/(services|events)\/(?!create$)[^/]+$/;

const absolute = (url: string) => (/^https?:\/\//.test(url) ? url : SITE_URL + url);

// Cut at a word boundary so snippets don't end mid-word
export function snippet(text: string | undefined, max = 155): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, clean.lastIndexOf(' ', max - 1)).replace(/[,.;:\s]+$/, '') + '…';
}

// Keep these two in step with scripts/seo-build.mjs, which writes the same
// tags into the HTML that crawlers and link previews read without JavaScript
export function serviceSeo(service: Service): PageSeo {
  return {
    title: `${service.serviceName} · ${categoryLabel(service.category)} in ${service.city} · ${site.siteName}`,
    description: snippet(service.description),
    path: `/services/${service.slug}`,
    image: service.coverImage || service.portfolioImages?.[0] || null
  };
}

export function eventSeo(event: Event): PageSeo {
  const when = new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  return {
    title: `${event.title} · ${when}, ${event.city} · ${site.siteName}`,
    description: snippet(`${eventTypeLabel(event.eventType)} on ${when} in ${event.city}. ${event.description || ''}`),
    path: `/events/${event.slug}`,
    image: event.coverPhoto || null,
    // Invite-only events are reachable by link but must never be indexed
    noindex: !event.isPublic
  };
}

/**
 * Title, description, canonical URL, robots and social tags for every page.
 * Known public pages come from core/seo/site.json; vendor and event pages
 * call set() once their data has loaded; anything else is private or not
 * found and is marked noindex.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private doc = inject(DOCUMENT);
  private router = inject(Router);
  private firstPage = true;

  init(): void {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      const path = (e as NavigationEnd).urlAfterRedirects.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
      // Structured data baked into the HTML belongs to the first page only
      if (!this.firstPage) this.doc.querySelectorAll('script[data-seo="page"]').forEach(s => s.remove());
      this.firstPage = false;

      const page = PAGES.get(path);
      if (page) {
        this.set({ title: page.title, description: page.description, path, noindex: 'noindex' in page && page.noindex });
      } else if (!DETAIL_PAGE.test(path)) {
        this.set({ title: site.siteName, description: site.pages[0].description, path: null, noindex: true });
      }
    });
  }

  set(page: PageSeo): void {
    const url = page.path ? pageUrl(page.path) : null;
    const image = absolute(page.image || site.defaultImage);

    this.title.setTitle(page.title);
    this.tag('name', 'description', page.description);
    this.tag('name', 'robots', page.noindex ? 'noindex' : 'index, follow, max-image-preview:large');
    this.canonical(page.noindex ? null : url);

    this.tag('property', 'og:title', page.title);
    this.tag('property', 'og:description', page.description);
    this.tag('property', 'og:type', page.type || 'website');
    this.tag('property', 'og:url', page.noindex ? null : url);
    this.tag('property', 'og:image', image);
    this.tag('name', 'twitter:title', page.title);
    this.tag('name', 'twitter:description', page.description);
    this.tag('name', 'twitter:image', image);
  }

  notFound(): void {
    this.set({ title: `Page not found · ${site.siteName}`, description: site.pages[0].description, path: null, noindex: true });
  }

  private tag(attr: 'name' | 'property', key: string, content: string | null): void {
    const selector = `${attr}="${key}"`;
    if (content === null) {
      this.meta.removeTag(selector);
    } else {
      this.meta.updateTag({ [attr]: key, content }, selector);
    }
  }

  private canonical(url: string | null): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!url) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.doc.createElement('link');
      link.rel = 'canonical';
      this.doc.head.appendChild(link);
    }
    link.href = url;
  }
}
