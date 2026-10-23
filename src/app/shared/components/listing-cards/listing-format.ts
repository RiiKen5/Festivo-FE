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
