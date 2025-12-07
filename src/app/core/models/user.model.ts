export interface User {
  _id: string;
  email: string;
  phone?: string;
  name: string;
  profilePhoto?: string;
  bio?: string;
  userType: 'organizer' | 'helper' | 'attendee' | 'all';
  location?: {
    type: 'Point';
    coordinates: [number, number];
    city?: string;
    address?: string;
  };
  city?: string;
  interests: string[];
  ratingAverage: number;
  totalRatings: number;
  eventsOrganized: number;
  eventsAttended: number;
  xpPoints: number;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  badges: Badge[];
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  notifications: NotificationPreferences;
  socialLinks?: SocialLinks;
  isActive: boolean;
  isVerified: boolean;
  isBanned: boolean;
  role: 'user' | 'admin';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Badge {
  name: string;
  icon: string;
  earnedAt: Date;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    tokens: { accessToken: any; refreshToken: any; };
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  city: string;
  userType: 'organizer' | 'helper' | 'attendee' | 'all';
}

export interface TokenResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
    emailVerified: boolean;
  };
}
