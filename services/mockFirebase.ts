import { User, Message, ChatRoom, Gender, UserRole, ChatMode } from '../types';

// In-memory storage for the session
let currentUser: User | null = null;
let messages: Message[] = [];
let rooms: ChatRoom[] = [
  { id: 'jungle_global', participants: [], isGroup: true, unreadCount: 0 } // The global jungle room
];

export const mockAuth = {
  login: async (name: string, gender: Gender, avatarUrl?: string): Promise<User> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Create new user
        currentUser = {
          id: `user_${Date.now()}`,
          name,
          gender,
          role: UserRole.USER,
          avatarUrl: avatarUrl || (gender === Gender.MALE 
            ? `https://picsum.photos/seed/${name}_m/200/200` 
            : `https://picsum.photos/seed/${name}_f/200/200`),
          isOnline: true,
        };
        resolve(currentUser);
      }, 500);
    });
  },
  
  logout: async () => {
    currentUser = null;
  },

  restoreSession: (user: User) => {
    currentUser = user;
    currentUser.isOnline = true;
  },

  getCurrentUser: () => currentUser,
};

export const mockDb = {
  getMessages: async (roomId: string): Promise<Message[]> => {
    // In a real app, filter by room. Here we simulate the Jungle global room vs private
    if (roomId === 'jungle_global') {
      return messages.filter(m => m.mode === ChatMode.JUNGLE);
    }
    // Mock private messages
    return messages.filter(m => m.mode === ChatMode.NORMAL);
  },

  sendMessage: async (text: string, mode: ChatMode, roomId: string): Promise<Message> => {
    if (!currentUser) throw new Error("Not logged in");

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      text,
      timestamp: Date.now(),
      mode,
      realSenderName: currentUser.name,
    };

    messages.push(newMessage);
    return newMessage;
  },

  getRooms: async (): Promise<ChatRoom[]> => {
    return rooms;
  },

  getUsers: async (): Promise<User[]> => {
    // Return current user if logged in
    const users: User[] = [];
    if (currentUser) {
      users.push(currentUser);
    }
    return users;
  }
};