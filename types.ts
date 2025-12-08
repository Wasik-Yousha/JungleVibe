export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN', // Super admin
}

export enum ChatMode {
  NORMAL = 'NORMAL',
  JUNGLE = 'JUNGLE', // Incognito
}

export interface User {
  id: string;
  name: string;
  gender: Gender;
  role: UserRole;
  avatarUrl: string;
  isOnline: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  mode: ChatMode;
  // For admin transparency in Jungle mode
  realSenderName?: string; 
}

export interface ChatRoom {
  id: string;
  participants: string[]; // User IDs
  lastMessage?: Message;
  unreadCount: number;
  isGroup: boolean; // Jungle is always group
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  count: number;
}