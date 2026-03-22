

export type Message = {
  id: number; // This is a client-side only ID derived from timestamp
  content: string;
  timestamp: string; // ISO 8601 string format
  sender: string; // phone number of the sender
  status: 'sent' | 'delivered' | 'read';
  image?: string;
  video?: string;
  audio?: string;
  isGenerating?: boolean;
  db_key?: string; // The key from Firebase DB
};

export type AllMessages = {
    [conversationKey: string]: {
        [messageKey: string]: Message;
    }
}

export type Contact = {
  id: string; // phone number of the contact
  name: string;
  avatar: string;
  online: boolean;
  lastMessage: string;
  lastMessageTime: string; // ISO 8601 string format
  unreadCount: number;
  lastSeen?: number | object; // Can be timestamp or server timestamp object
  isTyping?: boolean;
};

export type UserAccountStatus = 'active' | 'banned' | 'disabled';

export type User = {
    phoneNumber: string;
    name: string;
    profilePicture?: string;
    contacts?: string[];
    status?: {
      online: boolean;
      lastSeen: number | object; // Can be timestamp or server timestamp object
      account: UserAccountStatus;
    };
    fcmToken?: string;
    pushProvider?: 'fcm' | 'median-onesignal';
    oneSignalId?: string;
    oneSignalExternalId?: string;
    oneSignalSubscriptionId?: string;
}

export type AIUsageLog = {
    id: string;
    feature: 'chat' | 'image' | 'video' | 'smart-reply';
    timestamp: number;
    userId?: string;
};

export type BroadcastMessage = {
    id: string;
    message: string;
    timestamp: number;
};
    
