import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AuthService } from '../../core/services/auth.service';

interface Conversation {
  id: string;
  user: {
    name: string;
    avatar?: string;
  };
  lastMessage: string;
  timestamp: Date;
  unread: number;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, ButtonComponent],
  template: `
    <app-navbar></app-navbar>

    <main class="messages-page">
      <div class="messages-container">
        <!-- Sidebar -->
        <aside class="conversations-sidebar">
          <div class="sidebar-header">
            <h2>Messages</h2>
            <button class="new-message-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                <line x1="12" y1="8" x2="12" y2="14"/>
                <line x1="9" y1="11" x2="15" y2="11"/>
              </svg>
            </button>
          </div>

          <div class="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Search conversations..." [(ngModel)]="searchQuery">
          </div>

          <div class="conversations-list">
            @if (conversations().length === 0) {
              <div class="empty-conversations">
                <span class="empty-icon">💬</span>
                <p>No conversations yet</p>
                <span class="empty-hint">Start messaging vendors or organizers</span>
              </div>
            } @else {
              @for (conv of filteredConversations(); track conv.id) {
                <button
                  class="conversation-item"
                  [class.active]="selectedConversation()?.id === conv.id"
                  (click)="selectConversation(conv)"
                >
                  <div class="conv-avatar">
                    @if (conv.user.avatar) {
                      <img [src]="conv.user.avatar" [alt]="conv.user.name">
                    } @else {
                      <span>{{ conv.user.name.charAt(0).toUpperCase() }}</span>
                    }
                    @if (conv.unread > 0) {
                      <span class="unread-badge">{{ conv.unread }}</span>
                    }
                  </div>
                  <div class="conv-content">
                    <div class="conv-header">
                      <span class="conv-name">{{ conv.user.name }}</span>
                      <span class="conv-time">{{ formatTime(conv.timestamp) }}</span>
                    </div>
                    <p class="conv-preview">{{ conv.lastMessage }}</p>
                  </div>
                </button>
              }
            }
          </div>
        </aside>

        <!-- Chat Area -->
        <div class="chat-area">
          @if (selectedConversation()) {
            <div class="chat-header">
              <button class="back-btn" (click)="selectedConversation.set(null)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <div class="chat-user">
                <div class="user-avatar">
                  @if (selectedUser()?.avatar) {
                    <img [src]="selectedUser()?.avatar" [alt]="selectedUser()?.name">
                  } @else {
                    <span>{{ selectedUser()?.name?.charAt(0)?.toUpperCase() || '' }}</span>
                  }
                </div>
                <div class="user-info">
                  <h3>{{ selectedUser()?.name }}</h3>
                  <span class="user-status">Online</span>
                </div>
              </div>
              <button class="more-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="19" cy="12" r="1"/>
                  <circle cx="5" cy="12" r="1"/>
                </svg>
              </button>
            </div>

            <div class="chat-messages">
              <div class="message message--received">
                <div class="message-bubble">
                  <p>Hello! I saw your event and I'm interested in providing catering services.</p>
                  <span class="message-time">10:30 AM</span>
                </div>
              </div>
              <div class="message message--sent">
                <div class="message-bubble">
                  <p>Hi! That sounds great. What kind of menu options do you offer?</p>
                  <span class="message-time">10:32 AM</span>
                </div>
              </div>
              <div class="message message--received">
                <div class="message-bubble">
                  <p>We have a variety of options including Indian, Continental, and fusion cuisines. I can share our detailed menu if you're interested.</p>
                  <span class="message-time">10:35 AM</span>
                </div>
              </div>
            </div>

            <div class="chat-input">
              <button class="attach-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>
              <input
                type="text"
                placeholder="Type a message..."
                [(ngModel)]="newMessage"
                (keyup.enter)="sendMessage()"
              >
              <app-button (onClick)="sendMessage()" [disabled]="!newMessage.trim()">
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

    .sidebar-header {
      @include flex-between;
      padding: $spacing-4 $spacing-6;
      border-bottom: 1px solid $border-light;

      h2 {
        font-size: $font-size-xl;
        font-weight: $font-weight-semibold;
      }
    }

    .new-message-btn,
    .more-btn,
    .attach-btn {
      @include flex-center;
      width: 40px;
      height: 40px;
      border-radius: $radius-default;
      color: $text-secondary;
      transition: all $transition-fast;
      background: none;
      border: none;
      cursor: pointer;

      &:hover {
        background: $neutral-100;
        color: $text-primary;
      }
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: $spacing-3;
      margin: $spacing-4 $spacing-4;
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

    .chat-area {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: $bg-primary;
    }

    .chat-header {
      @include flex-between;
      padding: $spacing-3 $spacing-4;
      border-bottom: 1px solid $border-light;
    }

    .back-btn {
      display: none;
      @include flex-center;
      width: 40px;
      height: 40px;
      border-radius: $radius-default;
      color: $text-secondary;
      background: none;
      border: none;
      cursor: pointer;

      @include max-md {
        display: flex;
      }

      &:hover {
        background: $neutral-100;
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
      color: $success;
    }

    .chat-messages {
      flex: 1;
      padding: $spacing-4;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: $spacing-4;
      @include scrollbar-custom;
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
export class MessagesComponent {
  auth = inject(AuthService);

  searchQuery = '';
  newMessage = '';

  conversations = signal<Conversation[]>([
    {
      id: '1',
      user: { name: 'Catering Pro' },
      lastMessage: 'I can share our detailed menu if you\'re interested.',
      timestamp: new Date(),
      unread: 1
    },
    {
      id: '2',
      user: { name: 'DJ Beats' },
      lastMessage: 'Sure! I\'m available for your event date.',
      timestamp: new Date(Date.now() - 3600000),
      unread: 0
    }
  ]);

  selectedConversation = signal<Conversation | null>(null);

  selectedUser = computed(() => this.selectedConversation()?.user);

  filteredConversations(): Conversation[] {
    if (!this.searchQuery) return this.conversations();
    return this.conversations().filter(c =>
      c.user.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  selectConversation(conv: Conversation): void {
    this.selectedConversation.set(conv);
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    return new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    // Would send message via service
    this.newMessage = '';
  }
}
