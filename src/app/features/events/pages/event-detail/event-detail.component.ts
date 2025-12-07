import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { EventService } from '../../../../core/services/event.service';
import { RsvpService } from '../../../../core/services/rsvp.service';
import { TaskService } from '../../../../core/services/task.service';
import { FavoriteService } from '../../../../core/services/favorite.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Event } from '../../../../core/models/event.model';
import { User } from '../../../../core/models/user.model';
import { Rsvp, RsvpStatus } from '../../../../core/models/rsvp.model';
import { Task, TaskStatus, TaskCategory, TaskPriority } from '../../../../core/models/task.model';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, ButtonComponent, ModalComponent],
  template: `
    <app-navbar></app-navbar>

    @if (isLoading()) {
      <div class="loading-state">
        <div class="skeleton skeleton--image" style="height: 400px"></div>
        <div class="container">
          <div class="skeleton skeleton--title mt-6"></div>
          <div class="skeleton skeleton--text mt-4"></div>
          <div class="skeleton skeleton--text mt-2" style="width: 80%"></div>
        </div>
      </div>
    } @else if (event()) {
      <main class="event-detail">
        <!-- Hero Image -->
        <div class="event-hero" [style.background-image]="'url(' + (event()?.coverPhoto || 'assets/images/event-placeholder.jpg') + ')'">
          <div class="event-hero__overlay"></div>
          <div class="event-hero__content container">
            <div class="event-badges">
              <span class="badge badge--primary">{{ event()?.eventType }}</span>
              @if (!event()?.isPublic) {
                <span class="badge badge--warning">Private</span>
              }
              @if (event()?.isPaid) {
                <span class="badge badge--success">₹{{ event()?.entryFee }}</span>
              } @else {
                <span class="badge badge--success">Free</span>
              }
            </div>
            <h1 class="event-title">{{ event()?.title }}</h1>
            <div class="event-meta">
              <div class="meta-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {{ formatDate(event()?.date) }}
              </div>
              <div class="meta-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {{ event()?.time }}
              </div>
              <div class="meta-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ event()?.locationName || event()?.city }}
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="event-content">
          <div class="container">
            <div class="event-layout">
              <!-- Main Info -->
              <div class="event-main">
                <section class="event-section">
                  <h2 class="section-title">About this event</h2>
                  <p class="event-description">{{ event()?.description }}</p>
                </section>

                @if (event()?.tags?.length) {
                  <section class="event-section">
                    <h2 class="section-title">Tags</h2>
                    <div class="event-tags">
                      @for (tag of event()?.tags; track tag) {
                        <span class="tag">{{ tag }}</span>
                      }
                    </div>
                  </section>
                }

                <section class="event-section">
                  <h2 class="section-title">Location</h2>
                  <div class="location-card">
                    <div class="location-info">
                      <h3>{{ event()?.locationName }}</h3>
                      <p>{{ event()?.address }}</p>
                      <p>{{ event()?.city }}</p>
                    </div>
                    <a
                      [href]="'https://maps.google.com/?q=' + (event()?.location?.coordinates?.[1] || '') + ',' + (event()?.location?.coordinates?.[0] || '')"
                      target="_blank"
                      class="location-link"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      Open in Maps
                    </a>
                  </div>
                </section>

                <!-- Organizer Info -->
                <section class="event-section">
                  <h2 class="section-title">Organizer</h2>
                  <div class="organizer-card">
                    <div class="organizer-avatar">
                      @if (getOrganizer()?.profilePhoto) {
                        <img [src]="getOrganizer()?.profilePhoto" [alt]="getOrganizer()?.name">
                      } @else {
                        <span>{{ getOrganizer()?.name?.charAt(0)?.toUpperCase() }}</span>
                      }
                    </div>
                    <div class="organizer-info">
                      <h3>{{ getOrganizer()?.name }}</h3>
                      <p>{{ getOrganizer()?.eventsOrganized }} events organized</p>
                      <div class="organizer-rating">
                        ⭐ {{ getOrganizer()?.ratingAverage | number:'1.1-1' }}
                      </div>
                    </div>
                    @if (auth.isAuthenticated() && getOrganizer()?._id !== auth.currentUser()?._id) {
                      <app-button variant="secondary" size="sm" (onClick)="messageOrganizer()">Message</app-button>
                    }
                  </div>
                </section>

                <!-- Tasks Section (Organizer Only) -->
                @if (isOrganizer()) {
                  <section class="event-section tasks-section">
                    <div class="section-header">
                      <h2 class="section-title">Event Tasks</h2>
                      <app-button size="sm" (onClick)="openAddTaskModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add Task
                      </app-button>
                    </div>

                    @if (isLoadingTasks()) {
                      <div class="tasks-loading">
                        <div class="spinner"></div>
                        <span>Loading tasks...</span>
                      </div>
                    } @else if (tasks().length === 0) {
                      <div class="tasks-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                          <path d="M9 11l3 3L22 4"/>
                          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                        </svg>
                        <h3>No tasks yet</h3>
                        <p>Create tasks to organize your event planning</p>
                      </div>
                    } @else {
                      <!-- Task Progress -->
                      <div class="tasks-progress">
                        <div class="progress-bar">
                          <div class="progress-fill" [style.width.%]="getTaskCompletionPercent()"></div>
                        </div>
                        <span class="progress-text">
                          {{ getCompletedTasksCount() }}/{{ tasks().length }} completed
                        </span>
                      </div>

                      <!-- Task List -->
                      <div class="tasks-list">
                        @for (task of tasks(); track task._id) {
                          <div class="task-item" [class.task-item--done]="task.status === 'done'">
                            <button
                              class="task-checkbox"
                              [class.checked]="task.status === 'done'"
                              (click)="toggleTaskStatus(task)">
                              @if (task.status === 'done') {
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              }
                            </button>

                            <div class="task-content">
                              <div class="task-header">
                                <span class="task-name">{{ task.taskName }}</span>
                                <span class="task-priority" [class]="'priority--' + task.priority">
                                  {{ task.priority }}
                                </span>
                              </div>
                              @if (task.description) {
                                <p class="task-description">{{ task.description }}</p>
                              }
                              <div class="task-meta">
                                <span class="task-category">{{ formatCategory(task.category) }}</span>
                                @if (task.dueDate) {
                                  <span class="task-due" [class.overdue]="isOverdue(task)">
                                    Due: {{ task.dueDate | date:'shortDate' }}
                                  </span>
                                }
                              </div>
                            </div>

                            <div class="task-actions">
                              <button class="task-action" (click)="openEditTaskModal(task)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                              <button class="task-action task-action--delete" (click)="deleteTask(task)">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </section>
                }
              </div>

              <!-- Sidebar -->
              <aside class="event-sidebar">
                <div class="sidebar-card">
                  <div class="sidebar-stats">
                    <div class="stat">
                      <span class="stat-value">{{ event()?.currentAttendees }}</span>
                      <span class="stat-label">Attending</span>
                    </div>
                    <div class="stat">
                      <span class="stat-value">{{ event()?.maxAttendees || '∞' }}</span>
                      <span class="stat-label">Capacity</span>
                    </div>
                    <div class="stat">
                      <span class="stat-value">{{ event()?.views }}</span>
                      <span class="stat-label">Views</span>
                    </div>
                  </div>

                  @if (event()?.isPaid) {
                    <div class="sidebar-price">
                      <span class="price-label">Entry Fee</span>
                      <span class="price-value">₹{{ event()?.entryFee }}</span>
                    </div>
                  }

                  <div class="sidebar-actions">
                    @if (auth.isAuthenticated()) {
                      @if (isOrganizer()) {
                        <app-button [routerLink]="['/events', event()?.slug, 'edit']" fullWidth>
                          Edit Event
                        </app-button>
                        <app-button variant="secondary" fullWidth (onClick)="showManageOptions = true">
                          Manage Event
                        </app-button>
                      } @else if (isLoadingRsvp()) {
                        <app-button fullWidth [loading]="true" [disabled]="true">
                          Loading...
                        </app-button>
                      } @else if (userRsvp()) {
                        <!-- User has already RSVP'd -->
                        <div class="rsvp-status-card">
                          <div class="rsvp-status-header">
                            <span class="rsvp-check">✓</span>
                            <span>You're {{ userRsvp()?.status === 'going' ? 'Going' : userRsvp()?.status === 'interested' ? 'Interested' : 'Maybe Going' }}!</span>
                          </div>
                          @if (userRsvp()?.checkInCode) {
                            <div class="rsvp-code">
                              <span class="code-label">Check-in Code:</span>
                              <span class="code-value">{{ userRsvp()?.checkInCode }}</span>
                            </div>
                          }
                          @if (userRsvp()?.guestsCount && userRsvp()!.guestsCount > 0) {
                            <div class="rsvp-guests">
                              +{{ userRsvp()?.guestsCount }} guest(s)
                            </div>
                          }
                        </div>
                        <app-button variant="secondary" fullWidth (onClick)="rsvpModal = true">
                          Change RSVP
                        </app-button>
                        <app-button variant="ghost" fullWidth (onClick)="cancelRsvp()" [loading]="isCancellingRsvp()">
                          Cancel RSVP
                        </app-button>
                      } @else {
                        <!-- User hasn't RSVP'd yet -->
                        <app-button fullWidth (onClick)="rsvpModal = true">
                          @if (event()?.isPaid) {
                            Buy Ticket - ₹{{ event()?.entryFee }}
                          } @else {
                            RSVP Now - Free
                          }
                        </app-button>
                        <app-button variant="secondary" fullWidth (onClick)="toggleFavorite()">
                          @if (isFavorite()) {
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                            </svg>
                            Saved
                          } @else {
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                            </svg>
                            Save Event
                          }
                        </app-button>
                      }
                    } @else {
                      <app-button [routerLink]="['/auth/login']" [queryParams]="{returnUrl: '/events/' + event()?.slug}" fullWidth>
                        Login to RSVP
                      </app-button>
                    }
                  </div>

                  <div class="sidebar-share">
                    <span class="share-label">Share event</span>
                    <div class="share-buttons">
                      <button class="share-btn" (click)="shareOnTwitter()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                        </svg>
                      </button>
                      <button class="share-btn" (click)="shareOnWhatsApp()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </button>
                      <button class="share-btn" (click)="copyLink()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                          <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>

      <!-- RSVP Modal -->
      <app-modal
        [isOpen]="rsvpModal"
        [title]="userRsvp() ? 'Update Your RSVP' : 'RSVP to Event'"
        (onClose)="rsvpModal = false"
        [showFooter]="true"
      >
        <div class="rsvp-form">
          <div class="rsvp-event-info">
            <h4>{{ event()?.title }}</h4>
            <p>{{ formatDate(event()?.date) }} at {{ event()?.time }}</p>
          </div>

          <div class="form-group">
            <label class="form-label">Your Response</label>
            <div class="rsvp-options">
              <button
                type="button"
                class="rsvp-option"
                [class.active]="selectedRsvpStatus === 'going'"
                (click)="selectedRsvpStatus = 'going'"
              >
                <span class="option-icon">✓</span>
                <span class="option-label">Going</span>
              </button>
              <button
                type="button"
                class="rsvp-option"
                [class.active]="selectedRsvpStatus === 'interested'"
                (click)="selectedRsvpStatus = 'interested'"
              >
                <span class="option-icon">⭐</span>
                <span class="option-label">Interested</span>
              </button>
              <button
                type="button"
                class="rsvp-option"
                [class.active]="selectedRsvpStatus === 'maybe'"
                (click)="selectedRsvpStatus = 'maybe'"
              >
                <span class="option-icon">?</span>
                <span class="option-label">Maybe</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Additional Guests (optional)</label>
            <div class="guests-input">
              <button type="button" class="guests-btn" (click)="decrementGuests()" [disabled]="guestsCount <= 0">-</button>
              <span class="guests-count">{{ guestsCount }}</span>
              <button type="button" class="guests-btn" (click)="incrementGuests()" [disabled]="guestsCount >= 10">+</button>
            </div>
            <p class="form-hint">You + {{ guestsCount }} guest(s) = {{ guestsCount + 1 }} total</p>
          </div>

          @if (event()?.isPaid) {
            <div class="rsvp-total">
              <span>Total Amount:</span>
              <span class="total-value">₹{{ (event()?.entryFee || 0) * (guestsCount + 1) }}</span>
            </div>
          }
        </div>

        <div modal-footer>
          <app-button variant="ghost" (onClick)="closeRsvpModal()">Cancel</app-button>
          <app-button
            (onClick)="confirmRsvp()"
            [loading]="isSubmittingRsvp()"
            [disabled]="!selectedRsvpStatus"
          >
            {{ userRsvp() ? 'Update RSVP' : 'Confirm RSVP' }}
          </app-button>
        </div>
      </app-modal>

      <!-- Task Modal -->
      <app-modal
        [isOpen]="taskModal"
        [title]="editingTask ? 'Edit Task' : 'Add Task'"
        (onClose)="closeTaskModal()"
        [showFooter]="true"
      >
        <div class="task-form">
          <div class="form-group">
            <label class="form-label">Task Name *</label>
            <input
              type="text"
              class="form-input"
              [(ngModel)]="taskFormData.taskName"
              placeholder="e.g., Book the venue"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea
              class="form-textarea"
              [(ngModel)]="taskFormData.description"
              placeholder="Add more details..."
              rows="3"
            ></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Category *</label>
              <select class="form-select" [(ngModel)]="taskFormData.category">
                <option value="">Select category</option>
                <option value="venue">Venue</option>
                <option value="catering">Catering</option>
                <option value="decoration">Decoration</option>
                <option value="entertainment">Entertainment</option>
                <option value="photography">Photography</option>
                <option value="guest_management">Guest Management</option>
                <option value="logistics">Logistics</option>
                <option value="budget">Budget</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-select" [(ngModel)]="taskFormData.priority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Due Date</label>
            <input
              type="date"
              class="form-input"
              [(ngModel)]="taskFormData.dueDate"
            >
          </div>
        </div>

        <div modal-footer>
          <app-button variant="ghost" (onClick)="closeTaskModal()">Cancel</app-button>
          <app-button
            (onClick)="saveTask()"
            [loading]="isSavingTask()"
            [disabled]="!taskFormData.taskName || !taskFormData.category"
          >
            {{ editingTask ? 'Update Task' : 'Add Task' }}
          </app-button>
        </div>
      </app-modal>
    } @else {
      <div class="error-state">
        <span class="error-icon">😕</span>
        <h2>Event not found</h2>
        <p>This event may have been removed or doesn't exist.</p>
        <app-button routerLink="/events">Browse Events</app-button>
      </div>
    }
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    @use '../../../../../styles/mixins' as *;

    .loading-state,
    .error-state {
      min-height: calc(100vh - $navbar-height);
    }

    .error-state {
      @include flex-column-center;
      text-align: center;
      padding: $spacing-12;

      .error-icon {
        font-size: 4rem;
        margin-bottom: $spacing-4;
      }

      h2 {
        margin-bottom: $spacing-2;
      }

      p {
        color: $text-secondary;
        margin-bottom: $spacing-6;
      }
    }

    .event-hero {
      position: relative;
      height: 400px;
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: flex-end;

      @include md {
        height: 500px;
      }
    }

    .event-hero__overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%);
    }

    .event-hero__content {
      position: relative;
      color: $text-inverse;
      padding-bottom: $spacing-8;
    }

    .event-badges {
      display: flex;
      gap: $spacing-2;
      margin-bottom: $spacing-4;
    }

    .event-title {
      font-size: $font-size-3xl;
      font-weight: $font-weight-bold;
      margin-bottom: $spacing-4;

      @include md {
        font-size: $font-size-4xl;
      }
    }

    .event-meta {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-6;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      font-size: $font-size-base;
      opacity: 0.9;
    }

    .event-content {
      padding: $spacing-8 0;
      background: $bg-secondary;
    }

    .event-layout {
      display: grid;
      grid-template-columns: 1fr;
      gap: $spacing-8;

      @include lg {
        grid-template-columns: 1fr 380px;
      }
    }

    .event-section {
      background: $bg-primary;
      border-radius: $radius-lg;
      padding: $spacing-6;
      margin-bottom: $spacing-6;
    }

    .section-title {
      font-size: $font-size-lg;
      font-weight: $font-weight-semibold;
      margin-bottom: $spacing-4;
      padding-bottom: $spacing-3;
      border-bottom: 1px solid $border-light;
    }

    .event-description {
      color: $text-secondary;
      line-height: $line-height-relaxed;
      white-space: pre-wrap;
    }

    .event-tags {
      display: flex;
      flex-wrap: wrap;
      gap: $spacing-2;
    }

    .tag {
      padding: $spacing-1 $spacing-3;
      background: $neutral-100;
      border-radius: $radius-full;
      font-size: $font-size-sm;
    }

    .location-card {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: $spacing-4;
    }

    .location-info {
      h3 {
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-1;
      }

      p {
        color: $text-secondary;
        font-size: $font-size-sm;
      }
    }

    .location-link {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      color: $primary-600;
      font-weight: $font-weight-medium;
      font-size: $font-size-sm;
      white-space: nowrap;

      &:hover {
        color: $primary-700;
      }
    }

    .organizer-card {
      display: flex;
      align-items: center;
      gap: $spacing-4;
    }

    .organizer-avatar {
      @include avatar(56px);
      @include flex-center;
      background: $bg-gradient-primary;
      color: $text-inverse;
      font-weight: $font-weight-bold;
      font-size: $font-size-xl;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: inherit;
      }
    }

    .organizer-info {
      flex: 1;

      h3 {
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-1;
      }

      p {
        color: $text-secondary;
        font-size: $font-size-sm;
      }
    }

    .organizer-rating {
      font-size: $font-size-sm;
      margin-top: $spacing-1;
    }

    .sidebar-card {
      background: $bg-primary;
      border-radius: $radius-lg;
      padding: $spacing-6;
      position: sticky;
      top: calc($navbar-height + $spacing-4);
    }

    .sidebar-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: $spacing-4;
      margin-bottom: $spacing-6;
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      color: $primary-600;
    }

    .stat-label {
      font-size: $font-size-xs;
      color: $text-secondary;
      text-transform: uppercase;
      letter-spacing: $letter-spacing-wide;
    }

    .sidebar-price {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-4;
      background: $primary-50;
      border-radius: $radius-default;
      margin-bottom: $spacing-6;
    }

    .price-label {
      color: $text-secondary;
    }

    .price-value {
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      color: $primary-600;
    }

    .sidebar-actions {
      display: flex;
      flex-direction: column;
      gap: $spacing-3;
      margin-bottom: $spacing-6;
    }

    .sidebar-share {
      padding-top: $spacing-4;
      border-top: 1px solid $border-light;
    }

    .share-label {
      display: block;
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-bottom: $spacing-3;
    }

    .share-buttons {
      display: flex;
      gap: $spacing-2;
    }

    .share-btn {
      @include flex-center;
      width: 40px;
      height: 40px;
      border-radius: $radius-default;
      border: 1px solid $border-light;
      background: $bg-primary;
      color: $text-secondary;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        border-color: $primary-300;
        color: $primary-600;
      }
    }

    // RSVP Status Card
    .rsvp-status-card {
      background: $success-light;
      border-radius: $radius-default;
      padding: $spacing-4;
      margin-bottom: $spacing-3;
    }

    .rsvp-status-header {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      font-weight: $font-weight-semibold;
      color: $success-dark;
    }

    .rsvp-check {
      @include flex-center;
      width: 24px;
      height: 24px;
      background: $success;
      color: white;
      border-radius: $radius-full;
      font-size: $font-size-sm;
    }

    .rsvp-code {
      margin-top: $spacing-3;
      padding-top: $spacing-3;
      border-top: 1px solid rgba(0,0,0,0.1);
      font-size: $font-size-sm;
    }

    .code-label {
      color: $text-secondary;
    }

    .code-value {
      font-weight: $font-weight-bold;
      font-family: monospace;
      margin-left: $spacing-2;
    }

    .rsvp-guests {
      margin-top: $spacing-2;
      font-size: $font-size-sm;
      color: $success-dark;
    }

    // RSVP Modal Form
    .rsvp-form {
      padding: $spacing-2 0;
    }

    .rsvp-event-info {
      text-align: center;
      padding-bottom: $spacing-4;
      margin-bottom: $spacing-4;
      border-bottom: 1px solid $border-light;

      h4 {
        font-weight: $font-weight-semibold;
        margin-bottom: $spacing-1;
      }

      p {
        color: $text-secondary;
        font-size: $font-size-sm;
      }
    }

    .form-group {
      margin-bottom: $spacing-5;
    }

    .form-label {
      display: block;
      font-weight: $font-weight-medium;
      margin-bottom: $spacing-2;
    }

    .form-hint {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-top: $spacing-2;
    }

    .rsvp-options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: $spacing-3;
    }

    .rsvp-option {
      @include flex-column-center;
      padding: $spacing-4;
      border: 2px solid $border-light;
      border-radius: $radius-lg;
      background: $bg-primary;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        border-color: $primary-300;
      }

      &.active {
        border-color: $primary-600;
        background: $primary-50;
      }
    }

    .option-icon {
      font-size: $font-size-xl;
      margin-bottom: $spacing-2;
    }

    .option-label {
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
    }

    .guests-input {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $spacing-4;
    }

    .guests-btn {
      @include flex-center;
      width: 40px;
      height: 40px;
      border-radius: $radius-full;
      border: 1px solid $border-default;
      background: $bg-primary;
      font-size: $font-size-xl;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover:not(:disabled) {
        background: $primary-50;
        border-color: $primary-300;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .guests-count {
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      min-width: 40px;
      text-align: center;
    }

    .rsvp-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-4;
      background: $primary-50;
      border-radius: $radius-default;
      margin-top: $spacing-4;
    }

    .total-value {
      font-size: $font-size-xl;
      font-weight: $font-weight-bold;
      color: $primary-600;
    }

    // Tasks Section
    .tasks-section {
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: $spacing-3;
        border-bottom: 1px solid $border-light;
        margin-bottom: $spacing-4;

        .section-title {
          border: none;
          padding: 0;
          margin: 0;
        }
      }
    }

    .tasks-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $spacing-3;
      padding: $spacing-8;
      color: $text-muted;

      .spinner {
        width: 24px;
        height: 24px;
        border: 3px solid $border-light;
        border-top-color: $primary-600;
        border-radius: $radius-full;
        animation: spin 0.8s linear infinite;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .tasks-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: $spacing-8;
      text-align: center;
      color: $text-muted;

      svg {
        margin-bottom: $spacing-3;
        opacity: 0.5;
      }

      h3 {
        font-size: $font-size-base;
        font-weight: $font-weight-semibold;
        color: $text-primary;
        margin-bottom: $spacing-1;
      }

      p {
        font-size: $font-size-sm;
      }
    }

    .tasks-progress {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      margin-bottom: $spacing-4;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: $neutral-200;
      border-radius: $radius-full;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: $success;
      border-radius: $radius-full;
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: $font-size-sm;
      color: $text-secondary;
      white-space: nowrap;
    }

    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: $spacing-2;
    }

    .task-item {
      display: flex;
      align-items: flex-start;
      gap: $spacing-3;
      padding: $spacing-3;
      border: 1px solid $border-light;
      border-radius: $radius-default;
      transition: all $transition-fast;

      &:hover {
        border-color: $primary-200;
        background: $neutral-50;

        .task-actions {
          opacity: 1;
        }
      }

      &--done {
        opacity: 0.7;

        .task-name {
          text-decoration: line-through;
          color: $text-muted;
        }
      }
    }

    .task-checkbox {
      @include flex-center;
      width: 22px;
      height: 22px;
      border: 2px solid $border-default;
      border-radius: $radius-default;
      background: $bg-primary;
      cursor: pointer;
      flex-shrink: 0;
      margin-top: 2px;
      transition: all $transition-fast;

      &:hover {
        border-color: $primary-400;
      }

      &.checked {
        background: $success;
        border-color: $success;
        color: white;
      }
    }

    .task-content {
      flex: 1;
      min-width: 0;
    }

    .task-header {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      margin-bottom: $spacing-1;
    }

    .task-name {
      font-weight: $font-weight-medium;
      color: $text-primary;
    }

    .task-priority {
      font-size: $font-size-xs;
      padding: 2px $spacing-2;
      border-radius: $radius-full;
      text-transform: capitalize;

      &.priority--low {
        background: $neutral-100;
        color: $text-secondary;
      }

      &.priority--medium {
        background: $info-light;
        color: $info-dark;
      }

      &.priority--high {
        background: $warning-light;
        color: $warning-dark;
      }

      &.priority--urgent {
        background: $error-light;
        color: $error-dark;
      }
    }

    .task-description {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-bottom: $spacing-2;
    }

    .task-meta {
      display: flex;
      gap: $spacing-3;
      font-size: $font-size-xs;
      color: $text-muted;
    }

    .task-category {
      text-transform: capitalize;
    }

    .task-due {
      &.overdue {
        color: $error;
        font-weight: $font-weight-medium;
      }
    }

    .task-actions {
      display: flex;
      gap: $spacing-1;
      opacity: 0;
      transition: opacity $transition-fast;
    }

    .task-action {
      @include flex-center;
      width: 28px;
      height: 28px;
      background: none;
      border: none;
      border-radius: $radius-default;
      color: $text-muted;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover {
        background: $neutral-100;
        color: $text-primary;
      }

      &--delete:hover {
        background: $error-light;
        color: $error;
      }
    }

    // Task Form
    .task-form {
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: $spacing-4;

        @include max-sm {
          grid-template-columns: 1fr;
        }
      }
    }

    .form-input,
    .form-select,
    .form-textarea {
      width: 100%;
      padding: $spacing-3;
      border: 1px solid $border-default;
      border-radius: $radius-default;
      font-family: inherit;
      font-size: $font-size-base;
      transition: border-color $transition-fast;

      &:focus {
        outline: none;
        border-color: $primary-500;
      }
    }

    .form-textarea {
      resize: vertical;
    }
  `]
})
export class EventDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventService = inject(EventService);
  private rsvpService = inject(RsvpService);
  private taskService = inject(TaskService);
  private favoriteService = inject(FavoriteService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  event = signal<Event | null>(null);
  userRsvp = signal<Rsvp | null>(null);
  isLoading = signal(true);
  isLoadingRsvp = signal(false);
  isFavorite = signal(false);
  isSubmittingRsvp = signal(false);
  isCancellingRsvp = signal(false);

  // Tasks
  tasks = signal<Task[]>([]);
  isLoadingTasks = signal(false);
  isSavingTask = signal(false);
  taskModal = false;
  editingTask: Task | null = null;
  taskFormData: {
    taskName: string;
    description: string;
    category: TaskCategory | '';
    priority: TaskPriority;
    dueDate: string;
  } = {
    taskName: '',
    description: '',
    category: '',
    priority: 'medium',
    dueDate: ''
  };

  rsvpModal = false;
  showManageOptions = false;
  selectedRsvpStatus: RsvpStatus | null = null;
  guestsCount = 0;

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadEvent(slug);
    }
  }

  loadEvent(slug: string): void {
    this.eventService.getEventBySlug(slug).subscribe({
      next: (response) => {
        this.event.set(response.data);
        this.isLoading.set(false);

        // Check if favorited
        this.isFavorite.set(this.favoriteService.isFavorite(response.data._id, 'event'));

        // Load user's RSVP status if authenticated
        if (this.auth.isAuthenticated() && response.data._id) {
          this.loadUserRsvp(response.data._id);

          // Load tasks if organizer
          const organizer = response.data.organizer;
          const organizerId = typeof organizer === 'object' ? (organizer as User)._id : organizer;
          if (organizerId === this.auth.currentUser()?._id) {
            this.loadTasks(response.data._id);
          }
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadUserRsvp(eventId: string): void {
    this.isLoadingRsvp.set(true);
    this.rsvpService.getMyRsvp(eventId).subscribe({
      next: (response) => {
        this.userRsvp.set(response.data);
        // Pre-fill form if user already has RSVP
        if (response.data) {
          this.selectedRsvpStatus = response.data.status;
          this.guestsCount = response.data.guestsCount || 0;
        }
        this.isLoadingRsvp.set(false);
      },
      error: () => {
        this.isLoadingRsvp.set(false);
      }
    });
  }

  getOrganizer(): User | null {
    const organizer = this.event()?.organizer;
    if (typeof organizer === 'object') {
      return organizer as User;
    }
    return null;
  }

  isOrganizer(): boolean {
    const organizer = this.getOrganizer();
    return organizer?._id === this.auth.currentUser()?._id;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  confirmRsvp(): void {
    if (!this.selectedRsvpStatus || !this.event()) return;

    this.isSubmittingRsvp.set(true);

    const existingRsvp = this.userRsvp();

    if (existingRsvp) {
      // Update existing RSVP
      this.rsvpService.updateRsvp(existingRsvp._id, {
        status: this.selectedRsvpStatus,
        guestsCount: this.guestsCount
      }).subscribe({
        next: (response) => {
          this.userRsvp.set(response.data);
          this.toast.success('RSVP Updated!', 'Your response has been updated.');
          this.rsvpModal = false;
          this.isSubmittingRsvp.set(false);
        },
        error: (error) => {
          const message = error.error?.message || 'Failed to update RSVP. Please try again.';
          this.toast.error('Update Failed', message);
          this.isSubmittingRsvp.set(false);
        }
      });
    } else {
      // Create new RSVP
      this.rsvpService.createRsvp({
        eventId: this.event()!._id,
        status: this.selectedRsvpStatus,
        guestsCount: this.guestsCount
      }).subscribe({
        next: (response) => {
          this.userRsvp.set(response.data);
          // Update attendee count locally
          const currentEvent = this.event();
          if (currentEvent) {
            this.event.set({
              ...currentEvent,
              currentAttendees: currentEvent.currentAttendees + 1 + this.guestsCount
            });
          }
          this.toast.success('RSVP Confirmed!', 'You have successfully registered for this event.');
          this.rsvpModal = false;
          this.isSubmittingRsvp.set(false);
        },
        error: (error) => {
          const message = error.error?.message || 'Failed to RSVP. Please try again.';
          this.toast.error('RSVP Failed', message);
          this.isSubmittingRsvp.set(false);
        }
      });
    }
  }

  cancelRsvp(): void {
    const rsvp = this.userRsvp();
    if (!rsvp) return;

    this.isCancellingRsvp.set(true);

    this.rsvpService.cancelRsvp(rsvp._id).subscribe({
      next: () => {
        // Update attendee count locally
        const currentEvent = this.event();
        if (currentEvent) {
          const reduction = 1 + (rsvp.guestsCount || 0);
          this.event.set({
            ...currentEvent,
            currentAttendees: Math.max(0, currentEvent.currentAttendees - reduction)
          });
        }
        this.userRsvp.set(null);
        this.selectedRsvpStatus = null;
        this.guestsCount = 0;
        this.toast.success('RSVP Cancelled', 'Your registration has been cancelled.');
        this.isCancellingRsvp.set(false);
      },
      error: (error) => {
        const message = error.error?.message || 'Failed to cancel RSVP. Please try again.';
        this.toast.error('Cancel Failed', message);
        this.isCancellingRsvp.set(false);
      }
    });
  }

  closeRsvpModal(): void {
    this.rsvpModal = false;
    // Reset form if no existing RSVP
    if (!this.userRsvp()) {
      this.selectedRsvpStatus = null;
      this.guestsCount = 0;
    } else {
      // Reset to existing values
      this.selectedRsvpStatus = this.userRsvp()!.status;
      this.guestsCount = this.userRsvp()!.guestsCount || 0;
    }
  }

  incrementGuests(): void {
    if (this.guestsCount < 10) {
      this.guestsCount++;
    }
  }

  decrementGuests(): void {
    if (this.guestsCount > 0) {
      this.guestsCount--;
    }
  }

  shareOnTwitter(): void {
    const url = window.location.href;
    const text = `Check out this event: ${this.event()?.title}`;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  }

  shareOnWhatsApp(): void {
    const url = window.location.href;
    const text = `Check out this event: ${this.event()?.title}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href);
    this.toast.success('Link Copied!', 'Event link has been copied to clipboard.');
  }

  // Task Methods
  loadTasks(eventId: string): void {
    this.isLoadingTasks.set(true);
    this.taskService.getEventTasks(eventId).subscribe({
      next: (response) => {
        this.tasks.set(response.data);
        this.isLoadingTasks.set(false);
      },
      error: () => {
        this.isLoadingTasks.set(false);
      }
    });
  }

  getCompletedTasksCount(): number {
    return this.tasks().filter(t => t.status === 'done').length;
  }

  getTaskCompletionPercent(): number {
    const total = this.tasks().length;
    if (total === 0) return 0;
    return (this.getCompletedTasksCount() / total) * 100;
  }

  formatCategory(category: TaskCategory): string {
    const labels: Record<TaskCategory, string> = {
      'venue': 'Venue',
      'catering': 'Catering',
      'decoration': 'Decoration',
      'entertainment': 'Entertainment',
      'photography': 'Photography',
      'guest_management': 'Guest Management',
      'logistics': 'Logistics',
      'budget': 'Budget',
      'other': 'Other'
    };
    return labels[category] || category;
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'done') return false;
    return new Date(task.dueDate) < new Date();
  }

  toggleTaskStatus(task: Task): void {
    const newStatus: TaskStatus = task.status === 'done' ? 'pending' : 'done';

    this.taskService.updateTaskStatus(task._id, newStatus).subscribe({
      next: (response) => {
        this.tasks.update(tasks =>
          tasks.map(t => t._id === task._id ? response.data : t)
        );
      },
      error: () => {
        this.toast.error('Error', 'Failed to update task status.');
      }
    });
  }

  openAddTaskModal(): void {
    this.editingTask = null;
    this.taskFormData = {
      taskName: '',
      description: '',
      category: '',
      priority: 'medium',
      dueDate: ''
    };
    this.taskModal = true;
  }

  openEditTaskModal(task: Task): void {
    this.editingTask = task;
    this.taskFormData = {
      taskName: task.taskName,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    };
    this.taskModal = true;
  }

  closeTaskModal(): void {
    this.taskModal = false;
    this.editingTask = null;
  }

  saveTask(): void {
    if (!this.taskFormData.taskName || !this.taskFormData.category || !this.event()) return;

    this.isSavingTask.set(true);

    if (this.editingTask) {
      // Update existing task
      this.taskService.updateTask(this.editingTask._id, {
        taskName: this.taskFormData.taskName,
        description: this.taskFormData.description || undefined,
        category: this.taskFormData.category as TaskCategory,
        priority: this.taskFormData.priority,
        dueDate: this.taskFormData.dueDate || undefined
      }).subscribe({
        next: (response) => {
          this.tasks.update(tasks =>
            tasks.map(t => t._id === this.editingTask?._id ? response.data : t)
          );
          this.toast.success('Task Updated', 'Task has been updated successfully.');
          this.closeTaskModal();
          this.isSavingTask.set(false);
        },
        error: () => {
          this.toast.error('Error', 'Failed to update task.');
          this.isSavingTask.set(false);
        }
      });
    } else {
      // Create new task
      this.taskService.createTask({
        event: this.event()!._id,
        taskName: this.taskFormData.taskName,
        description: this.taskFormData.description || undefined,
        category: this.taskFormData.category as TaskCategory,
        priority: this.taskFormData.priority,
        dueDate: this.taskFormData.dueDate || undefined
      }).subscribe({
        next: (response) => {
          this.tasks.update(tasks => [...tasks, response.data]);
          this.toast.success('Task Created', 'New task has been added.');
          this.closeTaskModal();
          this.isSavingTask.set(false);
        },
        error: () => {
          this.toast.error('Error', 'Failed to create task.');
          this.isSavingTask.set(false);
        }
      });
    }
  }

  deleteTask(task: Task): void {
    if (!confirm('Are you sure you want to delete this task?')) return;

    this.taskService.deleteTask(task._id).subscribe({
      next: () => {
        this.tasks.update(tasks => tasks.filter(t => t._id !== task._id));
        this.toast.success('Task Deleted', 'Task has been removed.');
      },
      error: () => {
        this.toast.error('Error', 'Failed to delete task.');
      }
    });
  }

  messageOrganizer(): void {
    const organizerId = this.getOrganizer()?._id;
    if (organizerId) {
      this.router.navigate(['/messages', organizerId]);
    }
  }

  toggleFavorite(): void {
    const eventData = this.event();
    if (!eventData) return;

    this.favoriteService.toggleFavorite({
      id: eventData._id,
      type: 'event',
      name: eventData.title,
      image: eventData.coverPhoto
    }).subscribe(result => {
      this.isFavorite.set(result.isFavorite);
      if (result.isFavorite) {
        this.toast.success('Saved!', 'Event added to your favorites');
      } else {
        this.toast.info('Removed', 'Event removed from favorites');
      }
    });
  }
}
