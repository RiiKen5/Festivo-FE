// Display helpers shared by event/vendor cards and detail pages

const EVENT_TYPE_LABELS: Record<string, string> = {
  birthday: 'Birthday', house_party: 'House party', meetup: 'Meetup', wedding: 'Wedding',
  corporate: 'Corporate', farewell: 'Farewell', other: 'Event'
};

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food & cakes', decor: 'Decoration', photography: 'Photography', music: 'Music & DJ',
  cleanup: 'Cleanup', entertainment: 'Entertainment', venue: 'Venue', other: 'Other services'
};

const PRICE_UNITS: Record<string, string> = {
  per_event: 'per event', per_hour: 'per hour', per_day: 'per day', per_person: 'per guest'
};

export const eventTypeLabel = (type?: string) => EVENT_TYPE_LABELS[type || ''] || 'Event';
export const categoryLabel = (category?: string) => CATEGORY_LABELS[category || ''] || 'Service';
export const priceUnitLabel = (unit?: string) => PRICE_UNITS[unit || ''] || '';

// "19:00" -> "7:00 pm"
export function formatTime(time?: string): string {
  if (!time || !/^\d{1,2}:\d{2}/.test(time)) return time || '';
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${suffix}`;
}

// "Sat, 4 Nov"
export function formatShortDate(date?: Date | string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function plural(count: number, one: string, many = one + 's'): string {
  return `${count} ${count === 1 ? one : many}`;
}

// ---- Status wording shown to people (never the raw database values) ----

type Tone = 'wait' | 'act' | 'ok' | 'off';

interface BookingLike {
  status: string;
  paymentStatus?: string;
  priceAgreed?: number;
  pricePaid?: number;
}

/**
 * Where a booking stands, in plain words, from the viewer's side. "Accepted"
 * is not "booked": until money is paid the organizer is told to pay.
 */
export const bookingStage = (b: BookingLike, viewerIsVendor: boolean): { label: string; tone: Tone } => {
  const due = Math.max(0, (b.priceAgreed || 0) - (b.pricePaid || 0));
  switch (b.status) {
    case 'pending':
      return viewerIsVendor ? { label: 'New request · reply needed', tone: 'act' } : { label: 'Requested · waiting for vendor', tone: 'wait' };
    case 'confirmed':
    case 'in_progress':
      if (due > 0 && !(b.pricePaid || 0)) {
        return viewerIsVendor ? { label: 'Accepted · waiting for payment', tone: 'wait' } : { label: 'Accepted · pay to book', tone: 'act' };
      }
      if (due > 0) return { label: 'Advance paid', tone: 'ok' };
      return { label: 'Booked · paid', tone: 'ok' };
    case 'completed':
      return { label: 'Completed', tone: 'ok' };
    case 'refunded':
      return { label: 'Refunded', tone: 'off' };
    default:
      return { label: 'Cancelled', tone: 'off' };
  }
};

/** Short names for booking filters. */
export const bookingStatusLabel = (status?: string): string => ({
  pending: 'Requested', confirmed: 'Accepted', in_progress: 'Accepted',
  completed: 'Completed', cancelled: 'Cancelled', refunded: 'Refunded'
} as Record<string, string>)[status || ''] || 'Booking';

export const paymentStatusLabel = (status?: string): string => ({
  unpaid: 'Not paid yet', partial: 'Advance paid', paid: 'Paid in full', refunded: 'Refunded'
} as Record<string, string>)[status || ''] || '';

export const eventStatusLabel = (status?: string): string => ({
  draft: 'Draft', planning: 'Not published yet', active: 'Published', completed: 'Over', cancelled: 'Cancelled'
} as Record<string, string>)[status || ''] || '';
