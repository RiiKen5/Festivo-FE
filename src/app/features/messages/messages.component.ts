import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AuthService } from '../../core/services/auth.service';
import { MessageService } from '../../core/services/message.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { Conversation, Message } from '../../core/models/message.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, ButtonComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="messages-page">
      <div class="messages-container">
        <!-- Sidebar -->
        <aside class="conversations-sidebar" [class.show-sidebar]="!selectedConversation()">
          <div class="sidebar-header">
            <h2>Messages</h2>
          </div>

          <div class="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search conversations..." [(ngModel)]="searchQuery">
          </div>

          <div class="conversations-list">
            @if (isLoadingConversations()) {
              <div class="loading-state">
                @for (i of [1,2,3]; track i) {
                  <div class="skeleton-conv">
                    <div class="skeleton skeleton--avatar"></div>
                    <div class="skeleton-text">
                      <div class="skeleton skeleton--title"></div>
                      <div class="skeleton skeleton--subtitle"></div>
                    </div>
                  </div>
                }
              </div>
            } @else if (filteredConversations().length === 0) {
              <div class="empty-conversations">
                <span class="empty-icon">💬</span>
                <p>No conversations yet</p>
                <span class="empty-hint">Start messaging vendors or organizers</span>
              </div>
            } @else {
              @for (conv of filteredConversations(); track conv.user._id) {
                <button
                  class="conversation-item"
                  [class.active]="selectedUserId() === conv.user._id"
                  (click)="selectConversation(conv)"
                >
                  <div class="conv-avatar">
                    @if (conv.user.profilePhoto) {
                      <img [src]="conv.user.profilePhoto" [alt]="conv.user.name">
                    } @else {
                      <span>{{ conv.user.name.charAt(0).toUpperCase() }}</span>
                    }
                    @if (conv.unreadCount > 0) {
                      <span class="unread-badge">{{ conv.unreadCount }}</span>
                    }
                  </div>
                  <div class="conv-content">
                    <div class="conv-header">
                      <span class="conv-name">{{ conv.user.name }}</span>
                      <span class="conv-time">{{ formatTime(conv.lastMessage.createdAt) }}</span>
                    </div>
                    <p class="conv-preview">{{ conv.lastMessage.messageText }}</p>
                  </div>
                </button>
              }
            }
          </div>
        </aside>

        <!-- Chat Area -->
        <div class="chat-area" [class.show-chat]="selectedConversation()">
          @if (selectedConversation()) {
            <div class="chat-header">
              <button class="back-btn" (click)="clearSelection()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <div class="chat-user">
                <div class="user-avatar">
                  @if (selectedConversation()?.user?.profilePhoto) {
                    <img [src]="selectedConversation()?.user?.profilePhoto" [alt]="selectedConversation()?.user?.name">
                  } @else {
                    <span>{{ selectedConversation()?.user?.name?.charAt(0)?.toUpperCase() || '' }}</span>
                  }
                </div>
                <div class="user-info">
                  <h3>{{ selectedConversation()?.user?.name }}</h3>
                  <span class="user-status">Active</span>
                </div>
              </div>
              <button class="more-btn" [routerLink]="['/users', selectedUserId(), 'profile']">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                </svg>
              </button>
            </div>

            <div class="chat-messages" #messagesContainer>
              @if (isLoadingMessages()) {
                <div class="loading-messages">Loading messages...</div>
              } @else {
                @for (message of messages(); track message._id) {
                  <div class="message" [class.message--sent]="isSentByMe(message)" [class.message--received]="!isSentByMe(message)">
                    <div class="message-bubble">
                      <p>{{ message.messageText }}</p>
                      <span class="message-time">{{ formatMessageTime(message.createdAt) }}</span>
                    </div>
                  </div>
                }
              }
            </div>

            <div class="chat-input">
              <input
                type="text"
                placeholder="Type a message..."
                [(ngModel)]="newMessage"
                (keyup.enter)="sendMessage()"
                [disabled]="isSending()"
              >
              <app-button (onClick)="sendMessage()" [disabled]="!newMessage.trim()" [loading]="isSending()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </app-button>
            </div>
          } @else {
            <div class="no-chat-selected">
              <span class="empty-icon">💬</span>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the list to start messaging</p>
            </div>
          }
        </div>
      </div>
    </main>
  `,
  styles: [`
    @use '../../../styles/variables' as *;
    @use '../../../styles/mixins' as *;

    .messages-page {
      height: calc(100vh - $navbar-height);
      background: $bg-secondary;
    }

    .messages-container {
      display: grid;
      grid-template-columns: 1fr;
      height: 100%;

      @include md {
        grid-template-columns: 360px 1fr;
      }
    }

    .conversations-sidebar {
      background: $bg-primary;
      border-right: 1px solid $border-light;
      display: flex;
      flex-direction: column;
      height: 100%;

      @include max-md {
        display: none;

        &.show-sidebar {
          display: flex;
        }
      }
    }

    .chat-area {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: $bg-primary;

      @include max-md {
        display: none;

        &.show-chat {
          display: flex;
        }
      }
    }

    .sidebar-header {
      @include flex-between;
      padding: $spacing-4 $spacing-6;
      border-bottom: 1px solid $border-light;

      h2 {
        font-size: $font-size-xl;
        font-weight: $font-weight-semibold;
      }
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      margin: $spacing-4;
      padding: $spacing-3;
      background: $neutral-100;
      border-radius: $radius-default;

      svg {
        color: $text-muted;
        flex-shrink: 0;
      }

      input {
        flex: 1;
        border: none;
        background: none;
        font-size: $font-size-sm;

        &:focus {
          outline: none;
        }

        &::placeholder {
          color: $text-muted;
        }
      }
    }

    .conversations-list {
      flex: 1;
      overflow-y: auto;
      @include scrollbar-custom;
    }

    .loading-state {
      padding: $spacing-4;
    }

    .skeleton-conv {
      display: flex;
      gap: $spacing-3;
      padding: $spacing-3;
    }

    .skeleton--avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
    }

    .skeleton-text {
      flex: 1;
    }

    .empty-conversations {
      @include flex-column-center;
      padding: $spacing-12;
      text-align: center;

      .empty-icon {
        font-size: 3rem;
        margin-bottom: $spacing-4;
      }

      p {
        font-weight: $font-weight-medium;
        margin-bottom: $spacing-1;
      }

      .empty-hint {
        font-size: $font-size-sm;
        color: $text-secondary;
      }
    }

    .conversation-item {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      width: 100%;
      padding: $spacing-3 $spacing-4;
      text-align: left;
      background: none;
      border: none;
      cursor: pointer;
      transition: background $transition-fast;

      &:hover {
        background: $neutral-50;
      }

      &.active {
        background: $primary-50;
      }
    }

    .conv-avatar {
      position: relative;
      @include avatar(48px);
      @include flex-center;
      background: $bg-gradient-primary;
      color: $text-inverse;
      font-weight: $font-weight-semibold;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: inherit;
      }
    }

    .unread-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      @include flex-center;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      background: $primary-600;
      color: white;
      border-radius: $radius-full;
      font-size: 10px;
      font-weight: $font-weight-bold;
    }

    .conv-content {
      flex: 1;
      min-width: 0;
    }

    .conv-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: $spacing-1;
    }

    .conv-name {
      font-weight: $font-weight-medium;
    }

    .conv-time {
      font-size: $font-size-xs;
      color: $text-muted;
    }

    .conv-preview {
      font-size: $font-size-sm;
      color: $text-secondary;
      @include truncate;
    }

    .chat-header {
      @include flex-between;
      padding: $spacing-3 $spacing-4;
      border-bottom: 1px solid $border-light;
    }

    .back-btn,
    .more-btn {
      @include flex-center;
      width: 40px;
      height: 40px;
      border-radius: $radius-default;
      color: $text-secondary;
      background: none;
      border: none;
      cursor: pointer;

      &:hover {
        background: $neutral-100;
      }
    }

    .back-btn {
      display: none;

      @include max-md {
        display: flex;
      }
    }

    .chat-user {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      flex: 1;
    }

    .user-avatar {
      @include avatar(40px);
      @include flex-center;
      background: $bg-gradient-primary;
      color: $text-inverse;
      font-weight: $font-weight-semibold;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: inherit;
      }
    }

    .user-info {
      h3 {
        font-size: $font-size-base;
        font-weight: $font-weight-semibold;
      }
    }

    .user-status {
      font-size: $font-size-xs;
      color: $text-muted;
    }

    .chat-messages {
      flex: 1;
      padding: $spacing-4;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: $spacing-3;
      @include scrollbar-custom;
    }

    .loading-messages {
      text-align: center;
      color: $text-secondary;
      padding: $spacing-8;
    }

    .message {
      display: flex;
      max-width: 70%;

      &--sent {
        align-self: flex-end;

        .message-bubble {
          background: $primary-600;
          color: $text-inverse;
          border-radius: $radius-lg $radius-lg 0 $radius-lg;
        }

        .message-time {
          color: rgba(255,255,255,0.7);
        }
      }

      &--received {
        align-self: flex-start;

        .message-bubble {
          background: $neutral-100;
          border-radius: $radius-lg $radius-lg $radius-lg 0;
        }
      }
    }

    .message-bubble {
      padding: $spacing-3 $spacing-4;

      p {
        margin-bottom: $spacing-1;
        word-wrap: break-word;
      }
    }

    .message-time {
      font-size: $font-size-xs;
      color: $text-muted;
    }

    .chat-input {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      padding: $spacing-4;
      border-top: 1px solid $border-light;

      input {
        flex: 1;
        padding: $spacing-3 $spacing-4;
        border: 1px solid $border-light;
        border-radius: $radius-full;
        font-size: $font-size-base;

        &:focus {
          outline: none;
          border-color: $primary-500;
        }

        &:disabled {
          background: $neutral-100;
        }
      }
    }

    .no-chat-selected {
      @include flex-column-center;
      height: 100%;
      text-align: center;
      color: $text-secondary;

      .empty-icon {
        font-size: 4rem;
        margin-bottom: $spacing-4;
      }

      h3 {
        font-size: $font-size-xl;
        font-weight: $font-weight-semibold;
        color: $text-primary;
        margin-bottom: $spacing-2;
      }
    }
  `]
})
export class MessagesComponent implements OnInit {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private userService = inject(UserService);
  private toast = inject(ToastService);

  searchQuery = '';
  newMessage = '';

  conversations = signal<Conversation[]>([]);
  messages = signal<Message[]>([]);
  selectedConversation = signal<Conversation | null>(null);
  selectedUserId = signal<string | null>(null);

  isLoadingConversations = signal(true);
  isLoadingMessages = signal(false);
  isSending = signal(false);

  // For new conversations from route params
  private targetUserId: string | null = null;

  ngOnInit(): void {
    // Check if we're navigating to a specific user
    this.targetUserId = this.route.snapshot.paramMap.get('userId');
    this.loadConversations();
  }

  loadConversations(): void {
    this.isLoadingConversations.set(true);
    this.messageService.getConversations().subscribe({
      next: (response) => {
        this.conversations.set(response.data);
        this.isLoadingConversations.set(false);

        // If we have a target user from route params, select that conversation
        if (this.targetUserId) {
          const existingConv = response.data.find(c => c.user._id === this.targetUserId);
          if (existingConv) {
            // Select existing conversation
            this.selectConversation(existingConv);
          } else {
            // Create a new conversation placeholder by fetching the user
            this.startNewConversation(this.targetUserId);
          }
        }
      },
      error: () => {
        this.isLoadingConversations.set(false);
      }
    });
  }

  /**
   * Start a new conversation with a user who we haven't messaged before
   */
  startNewConversation(userId: string): void {
    this.userService.getUserById(userId).subscribe({
      next: (response) => {
        const user = response.data;
        // Create a placeholder conversation
        const newConv: Conversation = {
          user: user,
          lastMessage: {
            _id: '',
            sender: '',
            receiver: userId,
            messageText: '',
            isRead: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          unreadCount: 0
        };

        // Add to conversations list if not already present
        this.conversations.update(convs => {
          if (!convs.find(c => c.user._id === userId)) {
            return [newConv, ...convs];
          }
          return convs;
        });

        // Select this conversation
        this.selectedConversation.set(newConv);
        this.selectedUserId.set(userId);
        this.messages.set([]);
      },
      error: () => {
        this.toast.error('Error', 'Could not load user information');
      }
    });
  }

  filteredConversations(): Conversation[] {
    if (!this.searchQuery) return this.conversations();
    return this.conversations().filter(c =>
      c.user.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  selectConversation(conv: Conversation): void {
    this.selectedConversation.set(conv);
    this.selectedUserId.set(conv.user._id);
    this.loadMessages(conv.user._id);

    // Mark as read
    if (conv.unreadCount > 0) {
      this.messageService.markConversationAsRead(conv.user._id).subscribe(() => {
        this.conversations.update(conversations =>
          conversations.map(c =>
            c.user._id === conv.user._id ? { ...c, unreadCount: 0 } : c
          )
        );
      });
    }
  }

  loadMessages(userId: string): void {
    this.isLoadingMessages.set(true);
    this.messageService.getConversation(userId).subscribe({
      next: (response) => {
        this.messages.set(response.data);
        this.isLoadingMessages.set(false);
      },
      error: () => {
        this.isLoadingMessages.set(false);
      }
    });
  }

  clearSelection(): void {
    this.selectedConversation.set(null);
    this.selectedUserId.set(null);
    this.messages.set([]);
  }

  isSentByMe(message: Message): boolean {
    const currentUserId = this.auth.currentUser()?._id;
    const sender = message.sender as User;
    return sender?._id === currentUserId || message.sender === currentUserId;
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedUserId()) return;

    this.isSending.set(true);
    this.messageService.sendMessage({
      receiver: this.selectedUserId()!,
      messageText: this.newMessage.trim()
    }).subscribe({
      next: (response) => {
        this.messages.update(messages => [...messages, response.data]);
        this.newMessage = '';
        this.isSending.set(false);

        // Update conversation list
        const conv = this.selectedConversation();
        if (conv) {
          this.conversations.update(conversations =>
            conversations.map(c =>
              c.user._id === conv.user._id
                ? { ...c, lastMessage: response.data }
                : c
            )
          );
        }
      },
      error: () => {
        this.isSending.set(false);
        this.toast.error('Error', 'Failed to send message');
      }
    });
  }

  formatTime(date: Date | string): string {
    const now = new Date();
    const msgDate = new Date(date);
    const diff = now.getTime() - msgDate.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    return msgDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  formatMessageTime(date: Date | string): string {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
