export type Message = {
  id: number;
  content: string;
  timestamp: string;
  sender: string; // phone number of the sender
  status: 'sent' | 'delivered' | 'read';
  image?: string;
  isGenerating?: boolean;
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
};
