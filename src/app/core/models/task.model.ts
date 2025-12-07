import { User } from './user.model';
import { Event } from './event.model';

export interface Task {
  _id: string;
  event: Event | string;
  taskName: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: User | string;
  createdBy: User | string;
  dueDate?: Date;
  completedAt?: Date;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskCategory =
  | 'venue'
  | 'catering'
  | 'decoration'
  | 'entertainment'
  | 'photography'
  | 'guest_management'
  | 'logistics'
  | 'budget'
  | 'other';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled';

export interface TaskCreateData {
  event: string;
  taskName: string;
  description?: string;
  category: TaskCategory;
  priority?: TaskPriority;
  dueDate?: string;
  assignedTo?: string;
}

export interface TaskUpdateData {
  taskName?: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  assignedTo?: string;
}

export interface TasksResponse {
  success: boolean;
  count: number;
  data: Task[];
}

export interface TaskResponse {
  success: boolean;
  data: Task;
}
