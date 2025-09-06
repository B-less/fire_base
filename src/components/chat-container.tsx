
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Contact, Message, User } from '@/lib/types';
import { ContactList } from '@/components/contact-list';
import { ChatPanel } from '@/components/chat-panel';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateSmartReplies, SmartReplyOutput } from '@/ai/flows/smart-reply-suggestions';
import { generateChatResponse } from '@/ai/flows/conversational-ai-flow';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { ref, onValue, set, push } from 'firebase/database';

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

  // Load contacts and messages from Firebase
  useEffect(() => {
    if (!currentUser) return;

    const contactsRef = ref(db, `users/${currentUser.phoneNumber}/contacts`);
    const unsubscribe = onValue(contactsRef, async (snapshot) => {
      const contactIds = snapshot.val() || [];
      const contactsPromises = contactIds.map((id: string) => {
        return new Promise<Contact>((resolve) => {
          const userRef = ref(db, `users/${id}`);
          onValue(userRef, (userSnap) => {
            const userData = userSnap.val();
            const conversationKey = getConversationKey(currentUser.phoneNumber, id);
            const messagesRef = ref(db, `messages/${conversationKey}`);
            
            onValue(messagesRef, (messageSnap) => {
               const messagesData = messageSnap.val() || {};
               const messages: Message[] = Object.values(messagesData);
               const lastMessage = messages[messages.length - 1];
               
               const contact: Contact = {
                id: userData.phoneNumber,
                name: userData.name,
                avatar: `https://picsum.photos/seed/${id}/100/100`,
                online: false, // You could implement presence with RTDB
                lastMessage: lastMessage ? (lastMessage.content || "Image") : 'No messages yet',
                lastMessageTime: lastMessage ? lastMessage.timestamp : '',
                unreadCount: 0,
                messages,
              };
              resolve(contact);
            }, { onlyOnce: true });
          }, { onlyOnce: true });
        });
      });
      
      const resolvedContacts = await Promise.all(contactsPromises);
      
      // Ensure AI contact is present if it was added
      const hasAiContact = contacts.some(c => c.id === AI_CONTACT_ID);
      if (hasAiContact && !resolvedContacts.some(c => c.id === AI_CONTACT_ID)) {
          const aiContact: Contact = {
            id: AI_CONTACT_ID,
            name: 'AI Assistant',
            avatar: 'https://picsum.photos/seed/ai-avatar/100/100',
            online: true,
            lastMessage: 'Ask me anything!',
            lastMessageTime: '',
            unreadCount: 0,
            messages: contacts.find(c => c.id === AI_CONTACT_ID)?.messages || [],
          };
          resolvedContacts.unshift(aiContact);
      }
      
      setContacts(resolvedContacts);

    });

    return () => unsubscribe();
  }, [currentUser]);
  
  
  // Real-time messages for active chat
  useEffect(() => {
    if (!currentUser || !activeContactId) return;

    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
    const messagesRef = ref(db, `messages/${conversationKey}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
        const messagesData = snapshot.val() || {};
        const messages: Message[] = Object.values(messagesData);
        setContacts(prevContacts => prevContacts.map(c => 
            c.id === activeContactId ? { ...c, messages } : c
        ));
    });

    return () => unsubscribe();
  }, [currentUser, activeContactId]);


  const handleSelectContact = (contactId: string) => {
    setActiveContactId(contactId);
    if (isMobile) {
      setShowChatPanel(true);
    }
     setSmartReplies([]);
  };
  
  const handleAddContact = async (user: User) => {
    if (!currentUser) return;
    
    // Check if contact already exists locally
    if(contacts.some(c => c.id === user.phoneNumber)) {
        setActiveContactId(user.phoneNumber);
         if (isMobile) {
          setShowChatPanel(true);
        }
        return;
    }
    
    // Add to current user's contacts in DB
    const currentUserContactsRef = ref(db, `users/${currentUser.phoneNumber}/contacts`);
    const newContacts = [...contacts.filter(c=> c.id !== AI_CONTACT_ID).map(c => c.id), user.phoneNumber];
    await set(currentUserContactsRef, newContacts);

    // Add current user to the new contact's contacts in DB
    const newContactUserRef = ref(db, `users/${user.phoneNumber}`);
    onValue(newContactUserRef, async (snapshot) => {
        const newContactUserData = snapshot.val();
        const existingContacts = newContactUserData.contacts || [];
        if(!existingContacts.includes(currentUser.phoneNumber)) {
            const newContactContactsRef = ref(db, `users/${user.phoneNumber}/contacts`);
            await set(newContactContactsRef, [...existingContacts, currentUser.phoneNumber]);
        }
    }, { onlyOnce: true });

    const newContact: Contact = {
      id: user.phoneNumber,
      name: user.name,
      avatar: `https://picsum.photos/seed/${user.phoneNumber}/100/100`,
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
        avatar: 'https://picsum.photos/seed/ai-avatar/100/100',
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
    if (lastMessage.sender === currentUser.phoneNumber || lastMessage.isGenerating) return;

    const conversationHistory = contact.messages
      .filter(m => !m.isGenerating)
      .map((m) => `${m.sender === currentUser.phoneNumber ? 'User' : contact.name}: ${m.content}`)
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
      .map(m => `${m.sender === currentUser.phoneNumber ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');

    const lastMessage = contact.messages[contact.messages.length - 1];
    if (!lastMessage || lastMessage.sender !== currentUser.phoneNumber) return;

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
      
      setContacts(prevContacts => prevContacts.map(c => {
        if (c.id === AI_CONTACT_ID) {
          const updatedMessages = [...c.messages, aiMessage];
          return { ...c, messages: updatedMessages, lastMessage: response, lastMessageTime: aiMessage.timestamp };
        }
        return c;
      }));

    } catch (error) {
      console.error('Error getting AI response:', error);
    }
  }, [currentUser]);

  const handleSendMessage = (content: string, image?: string, isGenerating?: boolean) => {
    if (!activeContactId || !currentUser) return;
    
    const messageId = Date.now();
    const newMessage: Message = {
      id: messageId,
      content,
      image,
      sender: currentUser.phoneNumber,
      timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
      status: 'sent',
      isGenerating: isGenerating,
    };
    
    if (activeContactId === AI_CONTACT_ID) {
         setContacts((prevContacts) =>
          prevContacts.map((contact) => {
            if (contact.id === activeContactId) {
              const updatedMessages = [...contact.messages, newMessage];
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
    } else {
        const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
        const messagesRef = ref(db, `messages/${conversationKey}`);
        const newMessageRef = push(messagesRef);
        set(newMessageRef, newMessage);
    }

    setSmartReplies([]);
  };

  const handleUpdateMessage = (messageId: number, content: string, image?: string, isGenerating?: boolean) => {
    if (!activeContactId || !currentUser) return;
    
    if (activeContactId === AI_CONTACT_ID) {
         setContacts((prevContacts) =>
          prevContacts.map((contact) => {
            if (contact.id === activeContactId) {
              const updatedMessages = contact.messages.map(msg => 
                msg.id === messageId 
                  ? { ...msg, content, image, isGenerating: isGenerating, sender: currentUser.phoneNumber } // ensure sender is correct
                  : msg
              );
              return {
                  ...contact,
                  messages: updatedMessages,
                  lastMessage: content || 'Image',
                };
            }
            return contact;
          })
        );
    } else {
        // This is more complex with Firebase RTDB as we need to find the message key by its ID
        // For simplicity in this step, we'll assume new generated images are new messages.
        // A proper implementation would query for the message key.
        handleSendMessage(content, image, isGenerating);
    }
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
