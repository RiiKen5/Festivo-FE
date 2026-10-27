import { AvailabilityService, dayKey } from '../../core/services/availability.service';
import { AttributionService } from '../../core/services/attribution.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Component, inject, signal, computed, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, filter } from 'rxjs';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { VoiceNoteComponent } from './voice-note.component';
import { AuthService } from '../../core/services/auth.service';
import { MessageService } from '../../core/services/message.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { RealtimeService } from '../../core/services/realtime.service';
import { BookingService } from '../../core/services/booking.service';
import { ServiceService } from '../../core/services/service.service';
import { EventService } from '../../core/services/event.service';
import { Conversation, Message } from '../../core/models/message.model';
import { Booking } from '../../core/models/booking.model';
import { Service } from '../../core/models/service.model';
import { Event as FestivoEvent } from '../../core/models/event.model';
import { User } from '../../core/models/user.model';

// Only used when the live connection is down
const FALLBACK_POLL_MS = 20000;
const TYPING_IDLE_MS = 2500;
const MAX_RECORDING_SEC = 120;

interface DayGroup { label: string; messages: Message[]; }

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [IconComponent, CommonModule, RouterModule, FormsModule, ButtonComponent, ModalComponent, VoiceNoteComponent],
  template: `
    <main class="chat-page">
      <div class="chat-shell">
        <!-- Conversation list -->
        <aside class="inbox" [class.inbox--hidden]="selectedUserId()" aria-label="Conversations">
          <div class="inbox__head">
            <h1>Messages</h1>
          </div>
          <label class="inbox__search">
            <app-icon name="search" [size]="16"></app-icon>
            <span class="visually-hidden">Search conversations</span>
            <input type="search" placeholder="Search by name" [(ngModel)]="searchQuery">
          </label>

          <div class="inbox__list">
            @if (isLoadingConversations()) {
              @for (i of [1,2,3]; track i) {
                <div class="conv conv--skeleton"><div class="skeleton avatar"></div><div class="skeleton line"></div></div>
              }
            } @else if (filteredConversations().length === 0) {
              <div class="inbox__empty">
                <app-icon name="message" [size]="28"></app-icon>
                <p><strong>No conversations yet</strong></p>
                <p>Open a vendor's page and tap <em>Message</em> to ask about prices or dates.</p>
                <app-button routerLink="/services" size="sm" variant="secondary">Find vendors</app-button>
              </div>
            } @else {
              @for (conv of filteredConversations(); track conv.user._id) {
                <button type="button" class="conv" [class.conv--active]="selectedUserId() === conv.user._id"
                        [class.conv--unread]="conv.unreadCount > 0" (click)="openConversation(conv.user._id)">
                  <span class="avatar">
                    @if (conv.user.profilePhoto) { <img [src]="conv.user.profilePhoto" alt=""> } @else { {{ initial(conv.user.name) }} }
                    @if (isOnline(conv.user._id)) { <span class="avatar__online" title="Online"></span> }
                  </span>
                  <span class="conv__body">
                    <span class="conv__top">
                      <span class="conv__name">{{ conv.user.name }}</span>
                      <span class="conv__time">{{ listTime(conv.lastMessage.createdAt) }}</span>
                    </span>
                    <span class="conv__bottom">
                      <span class="conv__preview">
                        @if (typingFrom() === conv.user._id) { <em>typing…</em> } @else { {{ preview(conv.lastMessage) }} }
                      </span>
                      @if (conv.unreadCount > 0) {
                        <span class="conv__count">{{ conv.unreadCount }}<span class="visually-hidden"> unread</span></span>
                      }
                    </span>
                  </span>
                </button>
              }
            }
          </div>
        </aside>

        <!-- Open conversation -->
        <section class="thread" [class.thread--open]="selectedUserId()" aria-label="Conversation">
          @if (otherUser(); as other) {
            <header class="thread__head">
              <button type="button" class="icon-btn thread__back" (click)="closeConversation()" aria-label="Back to conversations">
                <app-icon name="arrow-left" [size]="20"></app-icon>
              </button>
              <span class="avatar avatar--sm">
                @if (other.profilePhoto) { <img [src]="other.profilePhoto" alt=""> } @else { {{ initial(other.name) }} }
              </span>
              <div class="thread__who">
                <h2>{{ other.name }}</h2>
                <span class="thread__status" aria-live="polite">
                  @if (typingFrom() === other._id) { typing… } @else if (isOnline(other._id)) { Online } @else { &nbsp; }
                </span>
              </div>
              @if (canRequestBooking()) {
                <app-button size="sm" (onClick)="openRequest()">Request booking</app-button>
              }
            </header>

            <!-- Current booking with this person, and what to do next -->
            @if (activeBooking(); as b) {
              <div class="deal" role="region" [attr.aria-label]="'Booking with ' + other.name">
                <div class="deal__info">
                  <span class="deal__title">{{ serviceName(b) }} · {{ b.eventDate | date:'EEE d MMM' }}</span>
                  <span class="deal__state" [class]="'deal__state--' + dealTone(b)">{{ dealStatus(b) }}</span>
                </div>
                <div class="deal__actions">
                  @if (iAmVendor(b) && b.status === 'pending') {
                    <app-button size="sm" (onClick)="openQuote(b)">Accept &amp; send price</app-button>
                    <app-button size="sm" variant="ghost" (onClick)="decline(b)">Decline</app-button>
                  } @else if (!iAmVendor(b) && isAccepted(b) && balance(b) > 0) {
                    <app-button size="sm" [routerLink]="['/bookings', b._id]">Pay ₹{{ balance(b) | number }}</app-button>
                  }
                  <a class="deal__link" [routerLink]="['/bookings', b._id]">Details</a>
                </div>
                @if (otherActiveCount() > 0) {
                  <a class="deal__more" routerLink="/bookings">+{{ otherActiveCount() }} more booking{{ otherActiveCount() > 1 ? 's' : '' }} with {{ other.name }}</a>
                }
              </div>
            }

            <div class="thread__messages" #scroller (scroll)="onScroll()">
              @if (isLoadingMessages()) {
                <p class="thread__note">Loading messages…</p>
              } @else if (messages().length === 0) {
                <div class="thread__intro">
                  <p><strong>Say hello to {{ other.name }}</strong></p>
                  <p>Ask about availability, prices or ideas.@if (canRequestBooking()) { When you're ready, tap <em>Request booking</em>. }</p>
                </div>
              }
              @for (day of dayGroups(); track day.label) {
                <div class="day"><span>{{ day.label }}</span></div>
                @for (m of day.messages; track m._id) {
                  @if (m.messageType === 'booking') {
                    <div class="event-card">
                      <app-icon name="calendar" [size]="16"></app-icon>
                      <span><strong>{{ isMine(m) ? 'You' : other.name }}:</strong> {{ m.messageText }}</span>
                      @if (m.relatedBooking) { <a [routerLink]="['/bookings', m.relatedBooking]">View</a> }
                    </div>
                  } @else {
                    <div class="bubble" [class.bubble--mine]="isMine(m)" [class.bubble--failed]="m.sendState === 'failed'">
                      @if (m.messageType === 'voice' && m.attachments?.length) {
                        <app-voice-note [src]="m.attachments![0]"></app-voice-note>
                      } @else if (m.messageType === 'voice') {
                        <p>Voice message · sending…</p>
                      } @else {
                        <p>{{ m.messageText }}</p>
                      }
                      <span class="bubble__meta">
                        {{ m.createdAt | date:'h:mm a' }}
                        @if (isMine(m)) {
                          @if (m.sendState === 'sending') {
                            <span class="tick" aria-label="Sending"><app-icon name="clock" [size]="12"></app-icon></span>
                          } @else if (m.sendState === 'failed') {
                            <button type="button" class="retry" (click)="retry(m)">Not sent · Retry</button>
                          } @else if (m.isRead) {
                            <span class="tick tick--read" aria-label="Seen">✓✓</span>
                          } @else {
                            <span class="tick" aria-label="Sent">✓</span>
                          }
                        }
                      </span>
                    </div>
                  }
                }
              }
            </div>

            @if (showJump()) {
              <button type="button" class="jump" (click)="scrollToBottom(true)">New messages ↓</button>
            }

            @if (recording()) {
              <div class="composer composer--rec" role="group" aria-label="Recording voice message">
                <button type="button" class="icon-btn" (click)="stopRecording(false)" aria-label="Cancel recording">
                  <app-icon name="trash" [size]="18"></app-icon>
                </button>
                <span class="rec__dot" aria-hidden="true"></span>
                <span class="rec__time" aria-live="off">{{ recClock() }}</span>
                <span class="rec__hint">Recording… tap send when done</span>
                <button type="button" class="send" (click)="stopRecording(true)" aria-label="Send voice message">
                  <app-icon name="send" [size]="18"></app-icon>
                </button>
              </div>
            } @else {
              <form class="composer" (submit)="$event.preventDefault(); send()">
                <label class="visually-hidden" for="composer-input">Message {{ other.name }}</label>
                <textarea id="composer-input" #composer rows="1" placeholder="Write a message…"
                          [(ngModel)]="draft" name="draft" maxlength="5000"
                          (input)="onDraftInput()" (keydown.enter)="onEnter($any($event))"></textarea>
                @if (draft.trim() || !canRecord) {
                  <button type="submit" class="send" [disabled]="!draft.trim()" aria-label="Send message">
                    <app-icon name="send" [size]="18"></app-icon>
                  </button>
                } @else {
                  <button type="button" class="send send--mic" (click)="startRecording()" aria-label="Record a voice message">
                    <app-icon name="mic" [size]="18"></app-icon>
                  </button>
                }
              </form>
            }
          } @else {
            <div class="thread__placeholder">
              <app-icon name="message" [size]="32"></app-icon>
              <h2>Your conversations</h2>
              <p>Pick a conversation to read and reply. Booking requests, prices and payments show up here too.</p>
            </div>
          }
        </section>
      </div>

      <!-- Organizer: request a booking without leaving the chat -->
      <app-modal [isOpen]="showRequest()" title="Request a booking" (onClose)="showRequest.set(false)" [showFooter]="true">
        @if (myEvents().length === 0) {
          <p>First create the event you're booking for, then come back to this chat.</p>
          <app-button routerLink="/events/create" variant="secondary">Create an event</app-button>
        } @else {
          <div class="form">
            <label>Which event?
              <select class="form-input" [(ngModel)]="request.eventId" (ngModelChange)="onRequestEvent()">
                @for (e of myEvents(); track e._id) { <option [value]="e._id">{{ e.title }} · {{ e.date | date:'d MMM' }}</option> }
              </select>
            </label>
            <label>Which service?
              <select class="form-input" [(ngModel)]="request.serviceId" (ngModelChange)="onRequestService()">
                @for (s of theirServices(); track s._id) { <option [value]="s._id">{{ s.serviceName }} · from ₹{{ s.basePrice | number }}</option> }
              </select>
            </label>
            <label>Date
              <input type="date" class="form-input" [class.form-input--error]="requestDateProblem()" [(ngModel)]="request.eventDate" [min]="today">
              @if (requestDateProblem(); as problem) { <span class="form-error" role="alert">{{ problem }}</span> }
            </label>
            <label>Your budget (₹)
              <input type="number" class="form-input" [(ngModel)]="request.price" min="0">
              <span class="hint">The vendor replies with their final price. You pay only after they accept.</span>
            </label>
            <label>What do you need? <span class="hint">(optional)</span>
              <textarea class="form-input" rows="3" [(ngModel)]="request.notes" placeholder="Theme, size, number of guests…"></textarea>
            </label>
          </div>
        }
        <div modal-footer>
          <app-button variant="ghost" (onClick)="showRequest.set(false)">Cancel</app-button>
          @if (myEvents().length) {
            <app-button [loading]="isSubmitting()" [disabled]="!request.eventId || !request.serviceId || !request.eventDate || !!requestDateProblem()" (onClick)="submitRequest()">Send request</app-button>
          }
        </div>
      </app-modal>

      <!-- Vendor: accept with a final price -->
      <app-modal [isOpen]="!!quoteFor()" title="Accept and send your price" (onClose)="quoteFor.set(null)" [showFooter]="true">
        <div class="form">
          <label>Your final price (₹)
            <input type="number" class="form-input" [(ngModel)]="quotePrice" min="0">
            <span class="hint">They proposed ₹{{ quoteFor()?.priceAgreed | number }}. After you accept, they can pay online and Festivo holds the money until the job is done.</span>
          </label>
        </div>
        <div modal-footer>
          <app-button variant="ghost" (onClick)="quoteFor.set(null)">Cancel</app-button>
          <app-button [loading]="isSubmitting()" (onClick)="sendQuote()">Accept booking</app-button>
        </div>
      </app-modal>
    </main>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .chat-page { height: calc(100dvh - #{$navbar-height}); background: $bg-secondary; }
    .chat-shell { display: grid; height: 100%; grid-template-columns: 1fr; @include md { grid-template-columns: 340px 1fr; } }

    .inbox { display: flex; flex-direction: column; min-height: 0; background: $bg-primary; border-right: 1px solid $border-light;
      @include max-md { &--hidden { display: none; } } }
    .inbox__head { padding: $spacing-4 $spacing-4 $spacing-2; h1 { font-size: $font-size-xl; } }
    .inbox__search { display: flex; align-items: center; gap: $spacing-2; margin: 0 $spacing-4 $spacing-3; padding: $spacing-2 $spacing-3;
      border-radius: $radius-default; background: $neutral-100; color: $text-muted;
      input { flex: 1; border: 0; background: none; font-size: $font-size-sm; &:focus { outline: none; } } }
    .inbox__list { flex: 1; overflow-y: auto; @include scrollbar-custom; }
    .inbox__empty { padding: $spacing-8 $spacing-6; text-align: center; color: $text-secondary;
      p { margin: $spacing-2 0; } app-button { display: inline-block; margin-top: $spacing-2; } }

    .conv { display: flex; gap: $spacing-3; align-items: center; width: 100%; padding: $spacing-3 $spacing-4;
      border: 0; background: none; text-align: left; cursor: pointer;
      &:hover { background: $neutral-50; } &--active { background: $primary-50; }
      &--skeleton .line { flex: 1; height: 14px; } }
    .conv__body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .conv__top, .conv__bottom { display: flex; justify-content: space-between; align-items: center; gap: $spacing-2; }
    .conv__name { font-weight: $font-weight-medium; @include truncate; }
    .conv__time { font-size: $font-size-xs; color: $text-muted; flex-shrink: 0; }
    .conv__preview { font-size: $font-size-sm; color: $text-secondary; @include truncate; }
    .conv--unread .conv__name, .conv--unread .conv__preview { color: $text-primary; font-weight: $font-weight-semibold; }
    .conv__count { min-width: 20px; height: 20px; padding: 0 6px; border-radius: $radius-full; background: $primary-600;
      color: $text-inverse; font-size: 11px; font-weight: $font-weight-semibold; @include flex-center; }

    .avatar { position: relative; @include avatar(44px); @include flex-center; flex-shrink: 0; background: $primary-100;
      color: $primary-800; font-weight: $font-weight-semibold;
      img { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
      &--sm { width: 36px; height: 36px; } }
    .avatar__online { position: absolute; right: 0; bottom: 0; width: 12px; height: 12px; border-radius: 50%;
      background: $success; border: 2px solid $bg-primary; }

    .thread { display: flex; flex-direction: column; min-height: 0; position: relative; background: $bg-primary;
      @include max-md { display: none; &--open { display: flex; } } }
    .thread__head { display: flex; align-items: center; gap: $spacing-3; padding: $spacing-2 $spacing-4; border-bottom: 1px solid $border-light; }
    .thread__back { @include md { display: none; } }
    .thread__who { flex: 1; min-width: 0; h2 { font-size: $font-size-base; @include truncate; } }
    .thread__status { display: block; font-size: $font-size-xs; color: $success-dark; min-height: 1em; }
    .icon-btn { @include flex-center; width: 40px; height: 40px; border: 0; border-radius: $radius-default; background: none;
      color: $text-secondary; cursor: pointer; &:hover { background: $neutral-100; } }

    .deal { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: $spacing-2 $spacing-4;
      padding: $spacing-3 $spacing-4; background: $neutral-50; border-bottom: 1px solid $border-light; }
    .deal__info { display: flex; flex-direction: column; min-width: 0; }
    .deal__title { font-size: $font-size-sm; font-weight: $font-weight-semibold; @include truncate; }
    .deal__state { font-size: $font-size-xs; font-weight: $font-weight-medium;
      &--wait { color: $warning-dark; } &--act { color: $primary-700; } &--ok { color: $success-dark; } &--off { color: $text-muted; } }
    .deal__actions { display: flex; align-items: center; gap: $spacing-2; }
    .deal__link, .deal__more { font-size: $font-size-sm; font-weight: $font-weight-medium; }
    .deal__more { flex-basis: 100%; font-size: $font-size-xs; }

    .thread__messages { flex: 1; overflow-y: auto; padding: $spacing-4; display: flex; flex-direction: column; gap: $spacing-2; @include scrollbar-custom; }
    .thread__note { text-align: center; color: $text-secondary; }
    .thread__intro { margin: auto; max-width: 320px; text-align: center; color: $text-secondary; p { margin: $spacing-1 0; } }
    .thread__placeholder { margin: auto; padding: $spacing-8; max-width: 360px; text-align: center; color: $text-secondary;
      h2 { margin: $spacing-3 0 $spacing-1; font-size: $font-size-lg; color: $text-primary; } }

    .day { display: flex; justify-content: center; margin: $spacing-3 0 $spacing-1;
      span { padding: 2px $spacing-3; border-radius: $radius-full; background: $neutral-100; font-size: $font-size-xs; color: $text-secondary; } }

    .bubble { align-self: flex-start; max-width: min(75%, 520px); padding: $spacing-2 $spacing-3; border-radius: $radius-lg $radius-lg $radius-lg 4px;
      background: $neutral-100;
      p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
      &--mine { align-self: flex-end; border-radius: $radius-lg $radius-lg 4px $radius-lg; background: $primary-600; color: $text-inverse;
        .bubble__meta { color: rgba(255, 255, 255, 0.8); } }
      &--failed { background: $error-light; color: $error-dark; .bubble__meta { color: $error-dark; } } }
    .bubble__meta { display: flex; justify-content: flex-end; align-items: center; gap: 4px; margin-top: 2px; font-size: 11px; color: $text-muted; }
    .tick { display: inline-flex; letter-spacing: -3px; &--read { color: #a5f3fc; font-weight: $font-weight-bold; } }
    .retry { border: 0; background: none; padding: 0; color: inherit; font: inherit; text-decoration: underline; cursor: pointer; }

    .event-card { align-self: center; display: flex; align-items: center; gap: $spacing-2; max-width: 90%; margin: $spacing-1 0;
      padding: $spacing-2 $spacing-3; border: 1px solid $border-light; border-radius: $radius-default; background: $bg-secondary;
      font-size: $font-size-sm; color: $text-secondary;
      app-icon { color: $primary-600; flex-shrink: 0; } a { font-weight: $font-weight-semibold; white-space: nowrap; } }

    .jump { position: absolute; left: 50%; bottom: 76px; transform: translateX(-50%); padding: $spacing-1 $spacing-3; border: 0;
      border-radius: $radius-full; background: $primary-600; color: $text-inverse; font-size: $font-size-sm; box-shadow: $shadow-md; cursor: pointer; }

    .composer { display: flex; align-items: flex-end; gap: $spacing-2; padding: $spacing-3 $spacing-4;
      padding-bottom: calc(#{$spacing-3} + env(safe-area-inset-bottom)); border-top: 1px solid $border-light;
      textarea { flex: 1; resize: none; max-height: 140px; padding: $spacing-2 $spacing-4; border: 1px solid $border-default;
        border-radius: 20px; font: inherit; line-height: 1.4; &:focus { outline: none; border-color: $primary-500; } } }
    .composer--rec { align-items: center; }
    .rec__dot { width: 10px; height: 10px; border-radius: 50%; background: $error; animation: blink 1s infinite; }
    @keyframes blink { 50% { opacity: 0.3; } }
    .rec__time { font-variant-numeric: tabular-nums; font-weight: $font-weight-semibold; }
    .rec__hint { flex: 1; font-size: $font-size-sm; color: $text-secondary; @include truncate; }
    .send { @include flex-center; width: 42px; height: 42px; flex-shrink: 0; border: 0; border-radius: 50%; background: $primary-600;
      color: $text-inverse; cursor: pointer; &:disabled { background: $neutral-300; cursor: default; } }

    .form { display: flex; flex-direction: column; gap: $spacing-4;
      label { display: flex; flex-direction: column; gap: $spacing-1; font-size: $font-size-sm; font-weight: $font-weight-medium; } }
    .hint { font-size: $font-size-xs; font-weight: $font-weight-regular; color: $text-secondary; }
  `]
})
export class MessagesComponent implements OnInit, OnDestroy {
  @ViewChild('scroller') private scroller?: ElementRef<HTMLElement>;
  @ViewChild('composer') private composer?: ElementRef<HTMLTextAreaElement>;

  private auth = inject(AuthService);
  private attribution = inject(AttributionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  private realtime = inject(RealtimeService);
  private bookingService = inject(BookingService);
  private serviceService = inject(ServiceService);
  private eventService = inject(EventService);
  private availability = inject(AvailabilityService);

  searchQuery = '';
  draft = '';
  today = new Date().toISOString().slice(0, 10);

  conversations = signal<Conversation[]>([]);
  messages = signal<Message[]>([]);
  selectedUserId = signal<string | null>(null);
  otherUser = signal<User | null>(null);
  bookings = signal<Booking[]>([]);
  theirServices = signal<Service[]>([]);
  myEvents = signal<FestivoEvent[]>([]);
  online = signal<Record<string, boolean>>({});
  typingFrom = signal<string | null>(null);
  showJump = signal(false);

  isLoadingConversations = signal(true);
  isLoadingMessages = signal(false);
  isSubmitting = signal(false);
  showRequest = signal(false);
  quoteFor = signal<Booking | null>(null);
  quotePrice = 0;
  request = { eventId: '', serviceId: '', eventDate: '', price: 0, notes: '' };

  private subs: Subscription[] = [];
  private pollTimer?: ReturnType<typeof setInterval>;
  private typingTimer?: ReturnType<typeof setTimeout>;
  private typingClear?: ReturnType<typeof setTimeout>;
  private sentTyping = false;

  // Voice recording
  readonly canRecord = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
  recording = signal(false);
  recSeconds = signal(0);
  private recorder?: MediaRecorder;
  private recChunks: Blob[] = [];
  private recTimer?: ReturnType<typeof setInterval>;
  private recStarted = 0;
  private atBottom = true;

  dayGroups = computed<DayGroup[]>(() => {
    const groups: DayGroup[] = [];
    for (const m of this.messages()) {
      const label = this.dayLabel(m.createdAt);
      const last = groups[groups.length - 1];
      if (last?.label === label) last.messages.push(m); else groups.push({ label, messages: [m] });
    }
    return groups;
  });

  // The booking that needs attention first: open ones, newest first
  private openBookings = computed(() =>
    this.bookings().filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status)));
  activeBooking = computed(() => this.openBookings()[0] || null);
  otherActiveCount = computed(() => Math.max(0, this.openBookings().length - 1));
  canRequestBooking = computed(() => this.theirServices().length > 0);

  ngOnInit(): void {
    this.loadConversations();
    this.subs.push(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.syncSelection()),
      this.realtime.newMessage$.subscribe(m => this.onIncoming(m)),
      this.realtime.messagesRead$.subscribe(({ readerId }) => {
        if (readerId === this.selectedUserId()) {
          this.messages.update(list => list.map(m => this.isMine(m) ? { ...m, isRead: true } : m));
        }
      }),
      this.realtime.typing$.subscribe(({ userId, typing }) => {
        this.typingFrom.set(typing ? userId : (this.typingFrom() === userId ? null : this.typingFrom()));
        clearTimeout(this.typingClear);
        if (typing) this.typingClear = setTimeout(() => this.typingFrom.set(null), 6000);
      }),
      this.realtime.presence$.subscribe(({ userId, online }) => this.online.update(o => ({ ...o, [userId]: online })))
    );
    this.syncSelection();
    this.pollTimer = setInterval(() => {
      if (!this.realtime.connected() && !document.hidden) this.refresh();
    }, FALLBACK_POLL_MS);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    clearInterval(this.pollTimer);
    clearTimeout(this.typingTimer);
    clearTimeout(this.typingClear);
    this.stopTyping();
    this.stopRecording(false);
    this.realtime.activeChatUserId = null;
  }

  // ---------- conversations ----------

  filteredConversations(): Conversation[] {
    const q = this.searchQuery.trim().toLowerCase();
    return q ? this.conversations().filter(c => c.user.name.toLowerCase().includes(q)) : this.conversations();
  }

  private syncSelection(): void {
    const userId = this.route.firstChild?.snapshot.paramMap.get('userId');
    if (userId) this.select(userId); else this.resetThread();
  }

  openConversation(userId: string): void {
    this.router.navigate(['/messages', userId]);
  }

  closeConversation(): void {
    this.router.navigate(['/messages']);
  }

  private loadConversations(): void {
    this.messageService.getConversations().subscribe({
      next: res => {
        this.conversations.set(res.data);
        this.isLoadingConversations.set(false);
        this.realtime.presence(res.data.map(c => c.user._id)).then(map => this.online.update(o => ({ ...o, ...map })));
      },
      error: () => this.isLoadingConversations.set(false)
    });
  }

  private select(userId: string): void {
    if (this.selectedUserId() === userId) return;
    this.stopTyping();
    this.selectedUserId.set(userId);
    this.realtime.activeChatUserId = userId;
    this.messages.set([]);
    this.bookings.set([]);
    this.theirServices.set([]);
    this.draft = '';

    const known = this.conversations().find(c => c.user._id === userId);
    this.otherUser.set(known?.user || null);
    if (!known) {
      this.userService.getUserProfile(userId).subscribe({
        next: res => this.otherUser.set(res.data),
        error: () => this.toast.error('Could not open this chat', 'The person may no longer be on Festivo.')
      });
    }

    this.loadMessages(userId);
    this.loadBookings(userId);
    this.serviceService.getServices({ provider: userId, limit: 20 }).subscribe({
      next: res => { if (this.selectedUserId() === userId) this.theirServices.set(res.data || []); }
    });
    this.realtime.presence([userId]).then(map => this.online.update(o => ({ ...o, ...map })));
  }

  private resetThread(): void {
    this.stopTyping();
    this.selectedUserId.set(null);
    this.otherUser.set(null);
    this.messages.set([]);
    this.realtime.activeChatUserId = null;
  }

  private loadMessages(userId: string, quiet = false): void {
    if (!quiet) this.isLoadingMessages.set(true);
    this.messageService.getConversation(userId).subscribe({
      next: res => {
        if (this.selectedUserId() !== userId) return;
        const pending = this.messages().filter(m => m.sendState);
        this.messages.set([...res.data, ...pending]);
        this.isLoadingMessages.set(false);
        this.clearUnread(userId);
        if (!quiet) this.scrollToBottom(true);
      },
      error: () => this.isLoadingMessages.set(false)
    });
  }

  private loadBookings(userId: string): void {
    this.bookingService.getBookingsWith(userId).subscribe({
      next: res => { if (this.selectedUserId() === userId) this.bookings.set(res.data || []); }
    });
  }

  // Opening a conversation marks it read on the server (getConversation)
  private clearUnread(userId: string): void {
    const conv = this.conversations().find(c => c.user._id === userId);
    if (!conv?.unreadCount) return;
    this.messageService.unreadCount.update(n => Math.max(0, n - conv.unreadCount));
    this.conversations.update(list => list.map(c => c.user._id === userId ? { ...c, unreadCount: 0 } : c));
  }

  private refresh(): void {
    this.loadConversations();
    const id = this.selectedUserId();
    if (id) this.loadMessages(id, true);
  }

  // ---------- live updates ----------

  private onIncoming(m: Message): void {
    const mine = this.isMine(m);
    const otherId = mine ? this.idOf(m.receiver) : this.idOf(m.sender);
    const open = otherId === this.selectedUserId();

    if (open) {
      if (!this.messages().some(x => x._id === m._id)) {
        this.messages.update(list => [...list, m]);
        this.scrollToBottom(mine);
      }
      if (!mine) {
        this.typingFrom.set(null);
        if (!document.hidden) this.messageService.markConversationAsRead(otherId).subscribe();
      }
      if (m.messageType === 'booking') this.loadBookings(otherId);
    }

    const existing = this.conversations().find(c => c.user._id === otherId);
    if (!existing) {
      this.loadConversations();
      return;
    }
    const unread = !mine && !open ? existing.unreadCount + 1 : existing.unreadCount;
    this.conversations.update(list => [
      { ...existing, lastMessage: m, unreadCount: unread },
      ...list.filter(c => c.user._id !== otherId)
    ]);
  }

  // ---------- sending ----------

  onEnter(event: KeyboardEvent): void {
    if (event.shiftKey || event.isComposing) return;
    event.preventDefault();
    this.send();
  }

  send(): void {
    const text = this.draft.trim();
    const to = this.selectedUserId();
    if (!text || !to) return;

    const me = this.auth.currentUser();
    const temp: Message = {
      _id: 'tmp-' + Date.now(),
      sender: me as User,
      receiver: to,
      messageText: text,
      messageType: 'text',
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      sendState: 'sending'
    };
    this.messages.update(list => [...list, temp]);
    this.draft = '';
    this.resizeComposer();
    this.stopTyping();
    this.scrollToBottom(true);
    this.deliver(temp);
  }

  retry(m: Message): void {
    this.messages.update(list => list.map(x => x._id === m._id ? { ...x, sendState: 'sending' } : x));
    this.deliver(m);
  }

  private deliver(temp: Message): void {
    const to = this.idOf(temp.receiver);
    this.messageService.sendMessage({ receiverId: to, messageText: temp.messageText }).subscribe({
      next: res => {
        // The live event may already have added the saved copy
        this.messages.update(list => {
          const withoutTemp = list.filter(x => x._id !== temp._id);
          return withoutTemp.some(x => x._id === res.data._id) ? withoutTemp : [...withoutTemp, res.data];
        });
        this.bumpConversation(to, res.data);
      },
      error: () => this.messages.update(list => list.map(x => x._id === temp._id ? { ...x, sendState: 'failed' } : x))
    });
  }

  private bumpConversation(userId: string, last: Message): void {
    const existing = this.conversations().find(c => c.user._id === userId);
    const user = existing?.user || this.otherUser();
    if (!user) return;
    this.conversations.update(list => [
      { user, lastMessage: last, unreadCount: existing?.unreadCount || 0 },
      ...list.filter(c => c.user._id !== userId)
    ]);
  }

  onDraftInput(): void {
    this.resizeComposer();
    const to = this.selectedUserId();
    if (!to) return;
    if (!this.sentTyping && this.draft.trim()) {
      this.realtime.typing(to, true);
      this.sentTyping = true;
    }
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => this.stopTyping(), TYPING_IDLE_MS);
  }

  private stopTyping(): void {
    const to = this.selectedUserId();
    if (this.sentTyping && to) this.realtime.typing(to, false);
    this.sentTyping = false;
  }

  private resizeComposer(): void {
    const el = this.composer?.nativeElement;
    if (!el) return;
    setTimeout(() => { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; });
  }

  // ---------- voice messages ----------

  async startRecording(): Promise<void> {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.toast.error('Microphone blocked', 'Allow microphone access in your browser to send voice messages.');
      return;
    }
    // Safari records mp4; Chrome and Firefox prefer webm/ogg with Opus
    const type = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(t => MediaRecorder.isTypeSupported(t));
    this.recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    this.recChunks = [];
    this.recorder.ondataavailable = e => { if (e.data.size) this.recChunks.push(e.data); };
    this.recorder.start();
    this.recStarted = Date.now();
    this.recSeconds.set(0);
    this.recording.set(true);
    this.stopTyping();
    this.recTimer = setInterval(() => {
      const sec = Math.floor((Date.now() - this.recStarted) / 1000);
      this.recSeconds.set(sec);
      if (sec >= MAX_RECORDING_SEC) this.stopRecording(true);
    }, 250);
  }

  stopRecording(send: boolean): void {
    const recorder = this.recorder;
    clearInterval(this.recTimer);
    this.recording.set(false);
    if (!recorder) return;
    this.recorder = undefined;
    const duration = (Date.now() - this.recStarted) / 1000;
    recorder.onstop = () => {
      recorder.stream.getTracks().forEach(t => t.stop());
      const to = this.selectedUserId();
      if (!send || !to) return;
      if (duration < 1) {
        this.toast.info('Too short', 'Record for at least a second.');
        return;
      }
      const blob = new Blob(this.recChunks, { type: (recorder.mimeType || 'audio/webm').split(';')[0] });
      this.sendVoice(to, blob, duration);
    };
    if (recorder.state !== 'inactive') recorder.stop(); else recorder.onstop(new Event('stop'));
  }

  recClock(): string {
    const s = this.recSeconds();
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  private sendVoice(to: string, blob: Blob, duration: number): void {
    const temp: Message = {
      _id: 'tmp-' + Date.now(), sender: this.auth.currentUser() as User, receiver: to, messageText: '',
      messageType: 'voice', isRead: false, createdAt: new Date(), updatedAt: new Date(), sendState: 'sending'
    };
    this.messages.update(list => [...list, temp]);
    this.scrollToBottom(true);
    this.messageService.sendVoice(to, blob, duration).subscribe({
      next: res => {
        this.messages.update(list => {
          const rest = list.filter(x => x._id !== temp._id);
          return rest.some(x => x._id === res.data._id) ? rest : [...rest, res.data];
        });
        this.bumpConversation(to, res.data);
      },
      error: () => {
        this.messages.update(list => list.filter(x => x._id !== temp._id));
        this.toast.error('Voice message not sent', 'Please try again.');
      }
    });
  }

  // ---------- booking actions ----------

  openRequest(): void {
    this.showRequest.set(true);
    this.eventService.getMyEvents({ limit: 50 } as any).subscribe({
      next: res => {
        const now = Date.now() - 864e5;
        const upcoming = ((res.data as FestivoEvent[]) || [])
          .filter(e => !['cancelled', 'completed'].includes(e.status) && new Date(e.date).getTime() >= now)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        this.myEvents.set(upcoming);
        this.request = { eventId: upcoming[0]?._id || '', serviceId: this.theirServices()[0]?._id || '', eventDate: '', price: 0, notes: '' };
        this.onRequestEvent();
        this.onRequestService();
      }
    });
  }

  onRequestEvent(): void {
    const e = this.myEvents().find(x => x._id === this.request.eventId);
    if (e) this.request.eventDate = new Date(e.date).toISOString().slice(0, 10);
  }

  onRequestService(): void {
    const s = this.theirServices().find(x => x._id === this.request.serviceId);
    if (s) this.request.price = s.basePrice;
    this.requestUnavailable.set({ blocked: [], full: [] });
    if (s) {
      this.availability.unavailable(s._id, dayKey(new Date()), dayKey(new Date(Date.now() + 119 * 864e5)))
        .subscribe({ next: d => this.requestUnavailable.set(d) });
    }
  }

  // Blocked or fully booked days for the chosen service
  private requestUnavailable = signal<{ blocked: string[]; full: string[] }>({ blocked: [], full: [] });

  requestDateProblem(): string {
    const day = this.request.eventDate;
    const name = this.otherUser()?.name || 'They';
    if (day && this.requestUnavailable().blocked.includes(day)) return `${name} isn't available on this date. Please pick another day.`;
    if (day && this.requestUnavailable().full.includes(day)) return `${name} is already booked on this date. Please pick another day.`;
    return '';
  }

  submitRequest(): void {
    this.isSubmitting.set(true);
    this.bookingService.createBooking({
      eventId: this.request.eventId,
      serviceId: this.request.serviceId,
      eventDate: this.request.eventDate,
      priceAgreed: Number(this.request.price) || 0,
      notes: this.request.notes.trim() || undefined,
      viaVendorLink: this.attribution.cameViaVendorLink(this.otherUser()?._id)
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.showRequest.set(false);
        this.toast.success('Request sent', `${this.otherUser()?.name} will reply with their final price.`);
        this.loadBookings(this.selectedUserId()!);
      },
      error: () => this.isSubmitting.set(false)
    });
  }

  openQuote(b: Booking): void {
    this.quotePrice = b.priceAgreed;
    this.quoteFor.set(b);
  }

  sendQuote(): void {
    const b = this.quoteFor();
    if (!b) return;
    this.isSubmitting.set(true);
    this.bookingService.accept(b._id, Number(this.quotePrice)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.quoteFor.set(null);
        this.toast.success('Booking accepted', 'They can now pay online.');
        this.loadBookings(this.selectedUserId()!);
      },
      // The error popup (if any) is shown by the app's error handler
      error: () => this.isSubmitting.set(false)
    });
  }

  decline(b: Booking): void {
    if (!confirm('Decline this booking request?')) return;
    this.bookingService.cancelBooking(b._id, 'Declined by vendor').subscribe({
      next: () => this.loadBookings(this.selectedUserId()!),
      error: err => this.toast.error('Could not decline', err.error?.message || 'Please try again.')
    });
  }

  // ---------- display helpers ----------

  iAmVendor(b: Booking): boolean {
    return this.idOf(b.vendor) === this.auth.currentUser()?._id;
  }

  isAccepted(b: Booking): boolean {
    return b.status === 'confirmed' || b.status === 'in_progress';
  }

  balance(b: Booking): number {
    return Math.max(0, (b.priceAgreed || 0) - (b.pricePaid || 0));
  }

  serviceName(b: Booking): string {
    return (b.service as Service)?.serviceName || 'Booking';
  }

  // Plain words for where the booking stands, from this user's side
  dealStatus(b: Booking): string {
    const vendor = this.iAmVendor(b);
    if (b.status === 'pending') return vendor ? 'New request · waiting for your reply' : `Waiting for ${this.otherUser()?.name} to accept`;
    if (this.balance(b) > 0) {
      if (b.pricePaid > 0) return `Advance paid · ₹${this.balance(b).toLocaleString('en-IN')} still due`;
      return vendor ? 'Accepted · waiting for payment' : 'Accepted · pay to lock the date';
    }
    return 'Paid · Festivo holds it until the job is done';
  }

  dealTone(b: Booking): string {
    if (b.status === 'pending') return this.iAmVendor(b) ? 'act' : 'wait';
    if (this.balance(b) > 0) return this.iAmVendor(b) ? 'wait' : 'act';
    return 'ok';
  }

  isMine(m: Message): boolean {
    return this.idOf(m.sender) === this.auth.currentUser()?._id;
  }

  isOnline(userId: string): boolean {
    return !!this.online()[userId];
  }

  initial(name?: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }

  preview(m: Message): string {
    if (!m?._id) return 'New conversation';
    const prefix = this.isMine(m) ? 'You: ' : '';
    if (m.messageType === 'voice') return prefix + 'Voice message';
    if (m.messageType === 'image') return prefix + 'Photo';
    return prefix + m.messageText;
  }

  listTime(date: Date | string): string {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const label = this.dayLabel(d);
    if (label === 'Today') return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
    return label === 'Yesterday' ? label : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  private dayLabel(date: Date | string): string {
    const d = new Date(date);
    const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((start(new Date()) - start(d)) / 864e5);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { weekday: diff < 7 ? 'long' : undefined, day: 'numeric', month: 'short',
      year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  }

  private idOf(ref: User | string): string {
    return typeof ref === 'string' ? ref : ref?._id;
  }

  // ---------- scrolling ----------

  onScroll(): void {
    const el = this.scroller?.nativeElement;
    if (!el) return;
    this.atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (this.atBottom) this.showJump.set(false);
  }

  /** Follow new messages only if the reader is already at the bottom. */
  scrollToBottom(force = false): void {
    if (!force && !this.atBottom) {
      this.showJump.set(true);
      return;
    }
    setTimeout(() => {
      const el = this.scroller?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
      this.atBottom = true;
      this.showJump.set(false);
    });
  }
}
