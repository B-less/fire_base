'use client';

import { useState, useEffect, useCallback } from 'react';
import { Contact, Message } from '@/lib/types';
import { CONTACTS as initialContacts } from '@/lib/data';
import { ContactList } from '@/components/contact-list';
import { ChatPanel } from '@/components/chat-panel';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateSmartReplies, SmartReplyOutput } from '@/ai/flows/smart-reply-suggestions';

export function ChatContainer() {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [activeContactId, setActiveContactId] = useState<string | null>(contacts[0]?.id || null);
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

  const handleBackToContacts = () => {
    setShowChatPanel(false);
  };

  const getSmartReplies = useCallback(async (contact: Contact) => {
    if (!contact.messages.length) return;
    const lastMessage = contact.messages[contact.messages.length - 1];
    if (lastMessage.sender === 'me') return;

    const conversationHistory = contact.messages
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

  const handleSendMessage = (content: string, image?: string) => {
    if (!activeContactId) return;

    const newMessage: Message = {
      id: Date.now(),
      content,
      image,
      sender: 'me',
      timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
      status: 'sent',
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
  
  useEffect(() => {
    if (activeContact) {
      getSmartReplies(activeContact);
    }
  }, [activeContact, getSmartReplies]);
  
  useEffect(() => {
    if (!isMobile) {
      setShowChatPanel(true);
    } else {
      setShowChatPanel(activeContactId !== null);
    }
  }, [isMobile, activeContactId]);

  return (
    <div className="flex h-full w-full">
      <div
        className={`h-full transition-all duration-300 ${
          isMobile && showChatPanel ? 'w-0 -translate-x-full' : 'w-full md:w-1/3 lg:w-1/4'
        }`}
      >
        <ContactList
          contacts={contacts}
          activeContactId={activeContactId}
          onSelectContact={handleSelectContact}
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
            onBack={isMobile ? handleBackToContacts : undefined}
            smartReplies={smartReplies}
            setSmartReplies={setSmartReplies}
          />
        ) : (
          <div className="hidden h-full items-center justify-center bg-muted/50 md:flex">
            <p className="text-muted-foreground">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
