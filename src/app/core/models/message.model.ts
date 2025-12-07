import { User } from './user.model';

export interface Message {
  _id: string;
  sender: User | string;
  receiver: User | string;
  messageText: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface MessageCreateData {
  receiver: string;
  messageText: string;
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
    count: number;
  };
}
