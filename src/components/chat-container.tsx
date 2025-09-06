
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Contact, Message, User } from '@/lib/types';
import { ContactList } from '@/components/contact-list';
import { ChatPanel } from '@/components/chat-panel';
import { generateSmartReplies, SmartReplyOutput } from '@/ai/flows/smart-reply-suggestions';
import { generateChatResponse } from '@/ai/flows/conversational-ai-flow';
import { sendPushNotification } from '@/ai/flows/push-notification-flow';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { ref, onValue, set, push, get, child, remove } from 'firebase/database';

const AI_CONTACT_ID = 'ai-assistant';

// Helper to get a consistent key for a conversation between two users
const getConversationKey = (user1: string, user2: string) => {
  return [user1, user2].sort().join('-');
}

export function ChatContainer() {
  const { user: currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<Record<string, User>>({});
  const [allMessages, setAllMessages] = useState<Record<string, Record<string, Message>>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all users once
  useEffect(() => {
    if (!currentUser) return;
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val() || {};
      setAllUsers(usersData);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Listen to all messages for conversations involving the current user
  useEffect(() => {
    if (!currentUser || !Object.keys(allUsers).length) return;

    const currentUserContacts = allUsers[currentUser.phoneNumber]?.contacts || [];
    const conversationKeys = currentUserContacts.map((contactId: string) => getConversationKey(currentUser.phoneNumber, contactId));
    
    const unsubscribers = conversationKeys.map(key => {
        const messagesRef = ref(db, `messages/${key}`);
        return onValue(messagesRef, (snapshot) => {
            const messagesData = snapshot.val() || {};
            setAllMessages(prev => ({ ...prev, [key]: messagesData }));
        });
    });

    // When the component unmounts, unsubscribe from all listeners
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());

  }, [currentUser, allUsers]);

  // Process data and build contacts list
  useEffect(() => {
    if (!currentUser || !Object.keys(allUsers).length) {
      setIsLoading(true);
      return;
    }
  
    const currentUserData = allUsers[currentUser.phoneNumber];
    if (!currentUserData || !currentUserData.contacts) {
      setContacts([]);
      setIsLoading(false);
      return;
    }
  
    const contactList = currentUserData.contacts
      .map((contactId: string) => {
        const contactUser = allUsers[contactId];
        if (!contactUser) return null;
  
        const conversationKey = getConversationKey(currentUser.phoneNumber, contactId);
        const conversationMessages = allMessages[conversationKey] ? Object.values(allMessages[conversationKey]) : [];
        conversationMessages.sort((a, b) => a.id - b.id);
        
        const lastMessage = conversationMessages.length > 0 ? conversationMessages[conversationMessages.length - 1] : null;
  
        return {
          id: contactUser.phoneNumber,
          name: contactUser.name,
          avatar: contactUser.profilePicture || `https://picsum.photos/seed/${contactId}/100/100`,
          online: false, // Online status can be implemented separately if needed
          lastMessage: lastMessage ? (lastMessage.content || (lastMessage.image ? "Image" : '')) : 'No messages yet',
          lastMessageTime: lastMessage ? lastMessage.timestamp : '',
          unreadCount: 0, // Unread count can be implemented separately
          messages: conversationMessages,
        };
      })
      .filter((c): c is Contact => c !== null);
      
    // Add AI contact if it was previously there or started
    const hasAIChat = contacts.some(c => c.id === AI_CONTACT_ID);
    if(hasAIChat && !contactList.some(c => c.id === AI_CONTACT_ID)) {
       const aiContact = contacts.find(c => c.id === AI_CONTACT_ID);
       if(aiContact) contactList.unshift(aiContact);
    }
    
    setContacts(contactList);
    setIsLoading(false);

  }, [currentUser, allUsers, allMessages]);
  
  const activeContact = useMemo(() => {
      const contact = contacts.find((c) => c.id === activeContactId);
      if (contact) {
          const conversationKey = contact.id !== AI_CONTACT_ID && currentUser ? getConversationKey(currentUser.phoneNumber, contact.id) : null;
          const messages = conversationKey && allMessages[conversationKey] 
              ? Object.values(allMessages[conversationKey]).sort((a,b) => a.id - b.id) 
              : contact.messages;
          return { ...contact, messages };
      }
      return undefined;
  }, [contacts, activeContactId, currentUser, allMessages]);


  const handleSelectContact = (contactId: string) => {
    setActiveContactId(contactId);
    setSmartReplies([]);
  };
  
  const handleAddContact = async (user: User) => {
    if (!currentUser) return;
    
    if(contacts.some(c => c.id === user.phoneNumber)) {
        setActiveContactId(user.phoneNumber);
        return;
    }
    
    // Add to current user's contacts in DB
    const currentUserContactsRef = ref(db, `users/${currentUser.phoneNumber}/contacts`);
    const snapshot = await get(currentUserContactsRef);
    const currentContacts = snapshot.val() || [];
    if (!currentContacts.includes(user.phoneNumber)) {
      await set(currentUserContactsRef, [...currentContacts, user.phoneNumber]);
    }

    // Add current user to the new contact's contacts in DB
    const newContactContactsRef = ref(db, `users/${user.phoneNumber}/contacts`);
    const newContactSnapshot = await get(newContactContactsRef);
    const newContactCurrentContacts = newContactSnapshot.val() || [];
    if (!newContactCurrentContacts.includes(currentUser.phoneNumber)) {
        await set(newContactContactsRef, [...newContactCurrentContacts, currentUser.phoneNumber]);
    }
    
    // The onValue listeners will automatically update the UI
    handleSelectContact(user.phoneNumber);
  };
  
  const handleStartAIChat = () => {
    if (!contacts.some(c => c.id === AI_CONTACT_ID)) {
      const aiContact: Contact = {
        id: AI_CONTACT_ID,
        name: 'AI Assistant',
        avatar: 'https://picsum.photos/seed/ai-robot-abstract-art/100/100',
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
    setActiveContactId(null);
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
        message: lastMessage.content || '',
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
      sender: currentUser.phoneNumber,
      timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
      status: 'sent',
      ...(image && { image }),
      ...(isGenerating && { isGenerating }),
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
        
        const dbMessage: any = { ...newMessage };
        if (dbMessage.image === undefined) delete dbMessage.image;
        if (dbMessage.isGenerating === undefined) delete dbMessage.isGenerating;
        
        set(newMessageRef, { ...dbMessage, db_key: newMessageRef.key });
        
        sendPushNotification({ 
            recipientId: activeContactId, 
            senderName: currentUser.name, 
            message: content || "Sent an image" 
        }).catch(err => console.error("Failed to send notification:", err));

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
                  ? { ...msg, content, image, isGenerating: isGenerating, sender: currentUser.phoneNumber }
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
        const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
        
        const messagesForConvo = allMessages[conversationKey] || {};
        const messageKeyToUpdate = Object.keys(messagesForConvo).find(key => messagesForConvo[key].id === messageId);
        
        if (messageKeyToUpdate) {
            const messageToUpdateRef = ref(db, `messages/${conversationKey}/${messageKeyToUpdate}`);
            const dbMessage = messagesForConvo[messageKeyToUpdate];
            
            const updatedMessage: any = {
                ...dbMessage,
                content: content,
            };
            
            if (image !== undefined) updatedMessage.image = image;
            if (isGenerating !== undefined) {
              updatedMessage.isGenerating = isGenerating;
            } else if ('isGenerating' in updatedMessage) {
              delete updatedMessage.isGenerating;
            }

            set(messageToUpdateRef, updatedMessage);
        } else {
            handleSendMessage(content, image, isGenerating);
        }
    }
  }

  const handleDeleteMessage = (messageId: number, dbKey?: string) => {
    if (!activeContactId || !currentUser) return;
    
    if (activeContactId === AI_CONTACT_ID) {
        setContacts(prev => prev.map(c => {
            if (c.id === AI_CONTACT_ID) {
                return { ...c, messages: c.messages.filter(m => m.id !== messageId) };
            }
            return c;
        }));
    } else {
        const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
        
        const keyToDelete = dbKey || Object.keys(allMessages[conversationKey] || {}).find(key => allMessages[conversationKey][key].id === messageId);

        if (keyToDelete) {
            const messageRef = ref(db, `messages/${conversationKey}/${keyToDelete}`);
            remove(messageRef);
        } else {
            console.error("Cannot delete message without a database key.");
        }
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
      <aside
        className={`h-full w-full flex-shrink-0 md:w-2/5 md:flex-shrink-0 lg:w-1/3 xl:w-1/4 ${
          activeContactId ? 'hidden md:flex' : 'flex'
        } flex-col`}
      >
        <ContactList
          contacts={contacts}
          activeContactId={activeContactId}
          onSelectContact={handleSelectContact}
          onAddContact={handleAddContact}
          onStartAIChat={handleStartAIChat}
          isLoading={isLoading}
        />
      </aside>
      <section
        className={`h-full flex-1 ${
          activeContactId ? 'flex' : 'hidden md:flex'
        } flex-col`}
      >
        {activeContact ? (
          <ChatPanel
            key={activeContact.id} // Add key to force re-mount on contact change
            contact={activeContact}
            onSendMessage={handleSendMessage}
            onUpdateMessage={handleUpdateMessage}
            onDeleteMessage={handleDeleteMessage}
            onBack={handleBackToContacts}
            smartReplies={smartReplies}
            setSmartReplies={setSmartReplies}
            isLoading={false} // Loading is handled at the contact list level
          />
        ) : (
           <NoContactsView />
        )}
      </section>
    </div>
  );
}

    