
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Contact, Message } from '@/lib/types';
import { ContactList } from '@/components/contact-list';
import { ChatPanel } from '@/components/chat-panel';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateSmartReplies, SmartReplyOutput } from '@/ai/flows/smart-reply-suggestions';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';

export function ChatContainer() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const activeContact = contacts.find((c) => c.id === activeContactId);

  const handleSelectContact = (contactId: string) => {
    setActiveContactId(contactId);
    if (isMobile) {
      setShowChatPanel(true);
    }
     setSmartReplies([]);
  };
  
  const handleAddContact = (name: string) => {
    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      name,
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

  const handleBackToContacts = () => {
    setShowChatPanel(false);
  };

  const getSmartReplies = useCallback(async (contact: Contact) => {
    if (!contact.messages.length) return;
    const lastMessage = contact.messages[contact.messages.length - 1];
    if (lastMessage.sender === 'me' || lastMessage.isGenerating) return;

    const conversationHistory = contact.messages
      .filter(m => !m.isGenerating)
      .map((m) => `${m.sender === 'me' ? 'User' : contact.name}: ${m.content}`)
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
  }, []);

  const handleSendMessage = (content: string, image?: string, isGenerating?: boolean) => {
    if (!activeContactId) return;

    const newMessage: Message = {
      id: Date.now(),
      content,
      image,
      sender: 'me',
      timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
      status: 'sent',
      isGenerating: isGenerating,
    };

    setContacts((prevContacts) =>
      prevContacts.map((contact) =>
        contact.id === activeContactId
          ? {
              ...contact,
              messages: [...contact.messages, newMessage],
              lastMessage: content || 'Image',
              lastMessageTime: newMessage.timestamp,
            }
          : contact
      )
    );
     setSmartReplies([]);
  };

  const handleUpdateMessage = (messageId: number, content: string, image?: string, isGenerating?: boolean) => {
    if (!activeContactId) return;

     setContacts((prevContacts) =>
      prevContacts.map((contact) =>
        contact.id === activeContactId
          ? {
              ...contact,
              messages: contact.messages.map(msg => 
                msg.id === messageId 
                  ? { ...msg, content, image, isGenerating } 
                  : msg
              ),
              lastMessage: content || 'Image',
            }
          : contact
      )
    );
  }
  
  useEffect(() => {
    if (activeContact) {
      getSmartReplies(activeContact);
    }
  }, [activeContact, getSmartReplies]);
  
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
