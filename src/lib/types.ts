export type Message = {
  id: number;
  content: string;
  timestamp: string;
  sender: 'me' | 'other';
  status: 'sent' | 'delivered' | 'read';
  image?: string;
  isGenerating?: boolean;
};

export type Contact = {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
};
