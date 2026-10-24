import { User } from './user.model';

export interface Message {
  _id: string;
  sender: User | string;
  receiver: User | string;
  messageText: string;
  // booking: a status card posted when a booking between the two changes
  messageType?: 'text' | 'image' | 'file' | 'voice' | 'booking';
  attachments?: string[];
  relatedBooking?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Client-side only, while a message is on its way
  sendState?: 'sending' | 'failed';
}

export interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface MessageCreateData {
  receiverId: string;
  messageText: string;
  relatedBookingId?: string;
}

export interface MessagesResponse {
  success: boolean;
  count: number;
  data: Message[];
}

export interface MessageResponse {
  success: boolean;
  data: Message;
}

export interface ConversationsResponse {
  success: boolean;
  data: Conversation[];
}

export interface UnreadMessagesCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}
