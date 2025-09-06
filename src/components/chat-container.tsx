
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Contact, Message } from '@/lib/types';
import type { AllMessages } from '@/lib/data';
import { ContactList } from '@/components/contact-list';
import { ChatPanel } from '@/components/chat-panel';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateSmartReplies, SmartReplyOutput } from '@/ai/flows/smart-reply-suggestions';
import { generateChatResponse } from '@/ai/flows/conversational-ai-flow';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/context/auth-context';

const CONTACTS_STORAGE_KEY = 'chirpchat_contacts_';
const MESSAGES_STORAGE_KEY = 'chirpchat_messages';
const AI_CONTACT_ID = 'ai-assistant';

// Helper to get a consistent key for a conversation between two users
const getConversationKey = (user1: string, user2: string) => {
  return [user1, user2].sort().join('-');
}

export function ChatContainer() {
  const { user: currentUser } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const activeContact = contacts.find((c) => c.id === activeContactId);

  // Load contacts from localStorage
  useEffect(() => {
    if (currentUser) {
      try {
        const storedContacts = localStorage.getItem(`${CONTACTS_STORAGE_KEY}${currentUser}`);
        const allMessages: AllMessages = JSON.parse(localStorage.getItem(MESSAGES_STORAGE_KEY) || '{}');

        if (storedContacts) {
          const loadedContacts: Contact[] = JSON.parse(storedContacts);
          // Update messages for each contact
          const updatedContacts = loadedContacts.map(contact => {
            const conversationKey = getConversationKey(currentUser, contact.id);
            const messages = allMessages[conversationKey] || [];
            const lastMessage = messages[messages.length - 1];
            return {
              ...contact,
              messages,
              lastMessage: lastMessage ? (lastMessage.content || "Image") : 'No messages yet',
              lastMessageTime: lastMessage ? lastMessage.timestamp : '',
            };
          });
          setContacts(updatedContacts);
        }
      } catch (error) {
        console.error("Failed to load contacts from localStorage", error);
      }
    }
  }, [currentUser]);

  // Save contacts to localStorage whenever they change
  useEffect(() => {
    if (currentUser) {
      try {
        // We only save the contact info, not the messages
        const contactsToSave = contacts.map(({ messages, ...contact }) => contact);
        localStorage.setItem(`${CONTACTS_STORAGE_KEY}${currentUser}`, JSON.stringify(contactsToSave));
      } catch (error) {
        console.error("Failed to save contacts to localStorage", error);
      }
    }
  }, [contacts, currentUser]);


  const handleSelectContact = (contactId: string) => {
    setActiveContactId(contactId);
    if (isMobile) {
      setShowChatPanel(true);
    }
     setSmartReplies([]);
  };
  
  const handleAddContact = (user: { name: string; phoneNumber: string }) => {
    // Check if contact already exists
    if(contacts.some(c => c.id === user.phoneNumber)) {
        setActiveContactId(user.phoneNumber);
         if (isMobile) {
          setShowChatPanel(true);
        }
        return;
    }

    const newContact: Contact = {
      id: user.phoneNumber,
      name: user.name,
      avatar: `https://picsum.photos/100/100?random=${Date.now()}`,
      online: false,
      lastMessage: 'No messages yet',
      lastMessageTime: '',
      unreadCount: 0,
      messages: [],
    };
    setContacts(prev => [newContact, ...prev]);
    handleSelectContact(newContact.id);
  };
  
  const handleStartAIChat = () => {
    if (!contacts.some(c => c.id === AI_CONTACT_ID)) {
      const aiContact: Contact = {
        id: AI_CONTACT_ID,
        name: 'AI Assistant',
        avatar: '/ai-avatar.png',
        online: true,
        lastMessage: 'Ask me anything!',
        lastMessageTime: '',
        unreadCount: 0,
        messages: [],
      };
      setContacts(prev => [aiContact, ...prev]);
    }
    handleSelectContact(AI_CONTACT_ID);
  };

  const handleBackToContacts = () => {
    setShowChatPanel(false);
  };

  const getSmartReplies = useCallback(async (contact: Contact) => {
    if (!contact.messages.length || !currentUser || contact.id === AI_CONTACT_ID) return;
    const lastMessage = contact.messages[contact.messages.length - 1];
    if (lastMessage.sender === currentUser || lastMessage.isGenerating) return;

    const conversationHistory = contact.messages
      .filter(m => !m.isGenerating)
      .map((m) => `${m.sender === currentUser ? 'User' : contact.name}: ${m.content}`)
      .join('\n');

    try {
      const result: SmartReplyOutput = await generateSmartReplies({
        message: lastMessage.content,
        conversationHistory: conversationHistory,
      });
      setSmartReplies(result.suggestions);
    } catch (error) {
      console.error('Error generating smart replies:', error);
      setSmartReplies([]);
    }
  }, [currentUser]);
  
  const getAIResponse = useCallback(async (contact: Contact) => {
    if (!currentUser || contact.id !== AI_CONTACT_ID) return;
    
    const conversationHistory = contact.messages
      .filter(m => !m.isGenerating)
      .map(m => `${m.sender === currentUser ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');

    const lastMessage = contact.messages[contact.messages.length - 1];
    if (!lastMessage || lastMessage.sender !== currentUser) return;

    try {
      const { response } = await generateChatResponse({
        message: lastMessage.content,
        conversationHistory,
      });

      const aiMessage: Message = {
        id: Date.now(),
        content: response,
        sender: AI_CONTACT_ID,
        timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
        status: 'read',
      };
      
      const conversationKey = getConversationKey(currentUser, AI_CONTACT_ID);

      setContacts(prevContacts => prevContacts.map(c => {
        if (c.id === AI_CONTACT_ID) {
          const updatedMessages = [...c.messages, aiMessage];
          updateMessages(conversationKey, updatedMessages);
          return { ...c, messages: updatedMessages, lastMessage: response, lastMessageTime: aiMessage.timestamp };
        }
        return c;
      }));

    } catch (error) {
      console.error('Error getting AI response:', error);
    }
  }, [currentUser]);

  const updateMessages = (conversationKey: string, newMessages: Message[]) => {
     try {
        const allMessages: AllMessages = JSON.parse(localStorage.getItem(MESSAGES_STORAGE_KEY) || '{}');
        allMessages[conversationKey] = newMessages;
        localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(allMessages));
      } catch (error) {
        console.error("Failed to save messages to localStorage", error);
      }
  }

  const handleSendMessage = (content: string, image?: string, isGenerating?: boolean) => {
    if (!activeContactId || !currentUser) return;

    const newMessage: Message = {
      id: Date.now(),
      content,
      image,
      sender: currentUser,
      timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
      status: 'sent',
      isGenerating: isGenerating,
    };
    
    const conversationKey = getConversationKey(currentUser, activeContactId);

    setContacts((prevContacts) =>
      prevContacts.map((contact) => {
        if (contact.id === activeContactId) {
          const updatedMessages = [...contact.messages, newMessage];
          updateMessages(conversationKey, updatedMessages);
          return {
            ...contact,
            messages: updatedMessages,
            lastMessage: content || 'Image',
            lastMessageTime: newMessage.timestamp,
          };
        }
        return contact;
      })
    );
     setSmartReplies([]);
  };

  const handleUpdateMessage = (messageId: number, content: string, image?: string, isGenerating?: boolean) => {
    if (!activeContactId || !currentUser) return;
    
    const conversationKey = getConversationKey(currentUser, activeContactId);

     setContacts((prevContacts) =>
      prevContacts.map((contact) => {
        if (contact.id === activeContactId) {
          const updatedMessages = contact.messages.map(msg => 
            msg.id === messageId 
              ? { ...msg, content, image, isGenerating, sender: currentUser } // ensure sender is correct
              : msg
          );
          updateMessages(conversationKey, updatedMessages);
          return {
              ...contact,
              messages: updatedMessages,
              lastMessage: content || 'Image',
            };
        }
        return contact;
      })
    );
  }
  
  useEffect(() => {
    if (activeContact) {
      if (activeContact.id === AI_CONTACT_ID) {
        getAIResponse(activeContact);
      } else {
        getSmartReplies(activeContact);
      }
    }
  }, [activeContact, getSmartReplies, getAIResponse]);
  
  useEffect(() => {
    if (!isMobile) {
      setShowChatPanel(true);
    } else {
       // On mobile, only show the chat panel if a contact is selected.
       setShowChatPanel(activeContactId !== null && contacts.length > 0);
    }
  }, [isMobile, activeContactId, contacts.length]);

  const NoContactsView = () => (
    <div className="hidden h-full flex-col items-center justify-center bg-muted/50 md:flex">
      <div className='flex flex-col items-center gap-4'>
         <div className='flex items-center justify-center w-24 h-24 bg-background rounded-full border-4 border-dashed border-muted-foreground/20'>
            <Plus className='w-12 h-12 text-muted-foreground/40' />
         </div>
         <p className="text-muted-foreground">No chats yet. Add a new contact to start messaging!</p>
      </div>
    </div>
  )

  return (
    <div className="flex h-full w-full">
      <div
        className={`h-full transition-all duration-300 ${
          isMobile && showChatPanel && contacts.length > 0 ? 'w-0 -translate-x-full' : 'w-full md:w-1/3 lg:w-1/4'
        }`}
      >
        <ContactList
          contacts={contacts}
          activeContactId={activeContactId}
          onSelectContact={handleSelectContact}
          onAddContact={handleAddContact}
          onStartAIChat={handleStartAIChat}
        />
      </div>
      <div
        className={`h-full flex-1 transition-all duration-300 ${
          isMobile && !showChatPanel ? 'hidden' : 'block'
        }`}
      >
        {activeContact ? (
          <ChatPanel
            contact={activeContact}
            onSendMessage={handleSendMessage}
            onUpdateMessage={handleUpdateMessage}
            onBack={isMobile ? handleBackToContacts : undefined}
            smartReplies={smartReplies}
            setSmartReplies={setSmartReplies}
          />
        ) : (
           <NoContactsView />
        )}
      </div>
    </div>
  );
}
