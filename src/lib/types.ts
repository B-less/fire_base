
export type Message = {
  id: number;
  content: string;
  timestamp: string;
  sender: string; // phone number of the sender
  status: 'sent' | 'delivered' | 'read';
  image?: string;
  isGenerating?: boolean;
  db_key?: string; // The key from Firebase DB
  recipientFcmToken?: string | null;
  senderName?: string;
};

export type Contact = {
  id: string; // phone number of the contact
  name: string;
  avatar: string;
  online: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  lastSeen?: number | string;
  isTyping?: boolean;
};

export type User = {
    phoneNumber: string;
    name: string;
    profilePicture?: string;
    fcmToken?: string;
    contacts?: string[];
    status?: {
      online: boolean;
      lastSeen: number;
    }
}
