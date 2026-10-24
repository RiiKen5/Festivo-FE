import { Task } from './task.model';
import { Booking } from './booking.model';
import { Service, ServiceCategory } from './service.model';

export interface PlanTask extends Task {
  serviceCategory?: ServiceCategory;
}

export interface EventPlan {
  tasks: PlanTask[];
  bookings: Booking[];
  // Up to three vendors in the event's city for each open checklist item
  suggestions: Partial<Record<ServiceCategory, Service[]>>;
}
