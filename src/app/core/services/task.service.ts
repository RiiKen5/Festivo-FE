import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Task,
  TaskCreateData,
  TaskUpdateData,
  TasksResponse,
  TaskResponse,
  TaskStatus
} from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private endpoint = '/tasks';

  constructor(private api: ApiService) {}

  /**
   * Create a new task for an event
   * POST /api/v1/tasks
   */
  createTask(data: TaskCreateData): Observable<TaskResponse> {
    return this.api.post<TaskResponse>(this.endpoint, data);
  }

  /**
   * Get all tasks for a specific event
   * GET /api/v1/tasks/event/:eventId
   */
  getEventTasks(eventId: string): Observable<TasksResponse> {
    return this.api.get<TasksResponse>(`${this.endpoint}/event/${eventId}`);
  }

  /**
   * Get a single task by ID
   * GET /api/v1/tasks/:taskId
   */
  getTaskById(taskId: string): Observable<TaskResponse> {
    return this.api.get<TaskResponse>(`${this.endpoint}/${taskId}`);
  }

  /**
   * Update a task
   * PUT /api/v1/tasks/:taskId
   */
  updateTask(taskId: string, data: TaskUpdateData): Observable<TaskResponse> {
    return this.api.put<TaskResponse>(`${this.endpoint}/${taskId}`, data);
  }

  /**
   * Update task status
   * PUT /api/v1/tasks/:taskId/status
   */
  updateTaskStatus(taskId: string, status: TaskStatus): Observable<TaskResponse> {
    return this.api.put<TaskResponse>(`${this.endpoint}/${taskId}/status`, { status });
  }

  /**
   * Delete a task
   * DELETE /api/v1/tasks/:taskId
   */
  deleteTask(taskId: string): Observable<{ success: boolean; message: string }> {
    return this.api.delete<{ success: boolean; message: string }>(`${this.endpoint}/${taskId}`);
  }
}
