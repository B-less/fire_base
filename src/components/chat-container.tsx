
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
import { ref, onValue, set, push, get, child, remove, query, limitToLast, off, ThenableReference } from 'firebase/database';

const AI_CONTACT_ID = 'ai-assistant';

// Helper to get a consistent key for a conversation between two users
const getConversationKey = (user1: string, user2: string) => {
  return [user1, user2].sort().join('-');
}

export function ChatContainer() {
  const { user: currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<Record<string, User>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [activeContactFullMessages, setActiveContactFullMessages] = useState<Record<string, Message>>({});


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

  // Listen for the LAST message in each conversation for the contact list preview
  useEffect(() => {
    if (!currentUser || !Object.keys(allUsers).length) return;

    const currentUserContacts = allUsers[currentUser.phoneNumber]?.contacts || [];
    const conversationKeys = currentUserContacts.map((contactId: string) => getConversationKey(currentUser.phoneNumber, contactId));

    const listeners = conversationKeys.map(key => {
      const messagesRef = query(ref(db, `messages/${key}`), limitToLast(1));
      const listener = onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
          const messageData = snapshot.val();
          const lastMessageKey = Object.keys(messageData)[0];
          const lastMessage = messageData[lastMessageKey];
          setLastMessages(prev => ({ ...prev, [key]: lastMessage }));
        }
      });
      return { ref: messagesRef, listener };
    });

    return () => {
      listeners.forEach(({ ref, listener }) => off(ref, 'value', listener));
    };
  }, [currentUser, allUsers]);

  // Process data and build contacts list
  useEffect(() => {
    if (!currentUser || !Object.keys(allUsers).length) {
      setIsLoading(true);
      return;
    }

    const currentUserData = allUsers[currentUser.phoneNumber];
    if (!currentUserData) {
      setIsLoading(false);
      return;
    }

    const contactList = (currentUserData.contacts || [])
      .map((contactId: string) => {
        const contactUser = allUsers[contactId];
        if (!contactUser) return null;

        const conversationKey = getConversationKey(currentUser.phoneNumber, contactId);
        const lastMessage = lastMessages[conversationKey];

        return {
          id: contactUser.phoneNumber,
          name: contactUser.name,
          avatar: contactUser.profilePicture || `https://picsum.photos/seed/${contactId}/100/100`,
          online: false,
          lastMessage: lastMessage ? (lastMessage.content || (lastMessage.image ? "Image" : '')) : 'No messages yet',
          lastMessageTime: lastMessage ? lastMessage.timestamp : '',
          unreadCount: 0,
          messages: lastMessage ? [lastMessage] : [],
        };
      })
      .filter((c): c is Contact => c !== null);

    setContacts(contactList);
    setIsLoading(false);

  }, [currentUser, allUsers, lastMessages]);

  useEffect(() => {
      if (activeContact?.id && activeContact.id !== AI_CONTACT_ID) {
          setIsMessagesLoading(true);
          const conversationKey = getConversationKey(currentUser!.phoneNumber, activeContact.id);
          const messagesRef = ref(db, `messages/${conversationKey}`);
          
          const unsubscribe = onValue(messagesRef, (snapshot) => {
              const messagesData = snapshot.val() || {};
              setActiveContactFullMessages(messagesData);
              setIsMessagesLoading(false);
          });
          
          return () => unsubscribe();
      } else {
        // Clear messages if no active contact or AI chat
        setActiveContactFullMessages({});
      }
  }, [activeContact?.id, currentUser]);

  const handleSelectContact = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    setActiveContact(contact || null);
    setSmartReplies([]);
  };

  const handleAddContact = async (user: User) => {
    if (!currentUser) return;
    
    if(contacts.some(c => c.id === user.phoneNumber)) {
        handleSelectContact(user.phoneNumber);
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
       setActiveContact(aiContact);
    } else {
      handleSelectContact(AI_CONTACT_ID);
    }
  };

  const handleBackToContacts = () => {
    setActiveContact(null);
  };

  const getSmartReplies = useCallback(async (contact: Contact, fullMessages: Message[]) => {
    if (!fullMessages.length || !currentUser || contact.id === AI_CONTACT_ID) return;
    const lastMessage = fullMessages[fullMessages.length - 1];
    if (lastMessage.sender === currentUser.phoneNumber || lastMessage.isGenerating) return;

    const conversationHistory = fullMessages
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
  
  const getAIResponse = useCallback(async () => {
    if (!currentUser || activeContact?.id !== AI_CONTACT_ID) return;
    
    const conversationHistory = activeContact.messages
      .filter(m => !m.isGenerating)
      .map(m => `${m.sender === currentUser.phoneNumber ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');

    const lastMessage = activeContact.messages[activeContact.messages.length - 1];
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
      
      setActiveContact(prev => {
        if (!prev) return null;
        const updatedMessages = [...prev.messages, aiMessage];
        const updatedContact = { ...prev, messages: updatedMessages, lastMessage: response, lastMessageTime: aiMessage.timestamp };
        setContacts(prevContacts => prevContacts.map(c => c.id === AI_CONTACT_ID ? updatedContact : c));
        return updatedContact;
      });

    } catch (error) {
      console.error('Error getting AI response:', error);
    }
  }, [currentUser, activeContact]);

  const handleSendMessage = (content: string, image?: string, isGenerating?: boolean): ThenableReference | undefined => {
    if (!activeContact || !currentUser) return;

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
    
    if (activeContact.id === AI_CONTACT_ID) {
        setActiveContact(prev => {
           if (!prev) return null;
           const updatedMessages = [...prev.messages, newMessage];
           const updatedContact = { ...prev, messages: updatedMessages, lastMessage: content || 'Image', lastMessageTime: newMessage.timestamp };
           setContacts(prevContacts => prevContacts.map(c => c.id === AI_CONTACT_ID ? updatedContact : c));
           return updatedContact;
        });
    } else {
        const conversationKey = getConversationKey(currentUser.phoneNumber, activeContact.id);
        const messagesRef = ref(db, `messages/${conversationKey}`);
        const newMessageRef = push(messagesRef);
        
        const dbMessage: any = { ...newMessage };
        if (dbMessage.image === undefined) delete dbMessage.image;
        if (dbMessage.isGenerating === undefined) delete dbMessage.isGenerating;
        
        const setPromise = set(newMessageRef, { ...dbMessage, db_key: newMessageRef.key });
        
        sendPushNotification({ 
            recipientId: activeContact.id, 
            senderName: currentUser.name, 
            message: content || "Sent an image" 
        }).catch(err => console.error("Failed to send notification:", err));

        setSmartReplies([]);
        return newMessageRef;
    }
  };

  const handleUpdateMessage = (dbKey: string, content: string, image?: string, isGenerating?: boolean) => {
    if (!activeContact || !currentUser) return;
    
    if (activeContact.id === AI_CONTACT_ID) {
        // This case might need adjustment if AI chat ever needs to update messages.
        // For now, we only update DB messages.
    } else {
        const conversationKey = getConversationKey(currentUser.phoneNumber, activeContact.id);
        const messageToUpdateRef = ref(db, `messages/${conversationKey}/${dbKey}`);
        
        // Optimistic update might be good here, but for now we just set.
        get(messageToUpdateRef).then((snapshot) => {
            if (snapshot.exists()) {
                const dbMessage = snapshot.val();
                
                const updatedMessage: any = { ...dbMessage, content: content };
                
                if (image !== undefined) updatedMessage.image = image;

                if (isGenerating !== undefined) {
                  updatedMessage.isGenerating = isGenerating;
                } else if ('isGenerating' in updatedMessage) {
                  delete updatedMessage.isGenerating;
                }

                set(messageToUpdateRef, updatedMessage);
            }
        });
    }
  }

  const handleDeleteMessage = (messageId: number, dbKey?: string) => {
    if (!activeContact || !currentUser) return;
    
    if (activeContact.id === AI_CONTACT_ID) {
        setActiveContact(prev => {
            if (!prev) return null;
            const updatedMessages = prev.messages.filter(m => m.id !== messageId);
            const updatedContact = { ...prev, messages: updatedMessages };
            setContacts(prevContacts => prevContacts.map(c => c.id === AI_CONTACT_ID ? updatedContact : c));
            return updatedContact;
        });
    } else {
        const conversationKey = getConversationKey(currentUser.phoneNumber, activeContact.id);
        
        const keyToDelete = dbKey || Object.keys(activeContactFullMessages || {}).find(key => activeContactFullMessages[key].id === messageId);

        if (keyToDelete) {
            const messageRef = ref(db, `messages/${conversationKey}/${keyToDelete}`);
            remove(messageRef);
        } else {
            console.error("Cannot delete message without a database key.");
        }
    }
  }
  
  const currentChatMessages = useMemo(() => {
    if (!activeContact) return [];
    if (activeContact.id === AI_CONTACT_ID) {
        return activeContact.messages;
    }
    return Object.values(activeContactFullMessages).sort((a,b) => a.id - b.id);
  }, [activeContact, activeContactFullMessages]);

  useEffect(() => {
    if (activeContact && currentChatMessages.length > 0) {
      if (activeContact.id === AI_CONTACT_ID) {
        getAIResponse();
      } else {
        getSmartReplies(activeContact, currentChatMessages);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContact, currentChatMessages]);


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
        className={`h-full w-full flex-shrink-0 transition-all duration-300 md:w-2/5 md:flex-shrink-0 lg:w-1/3 xl:w-1/4 ${
          activeContact ? 'hidden md:flex' : 'flex'
        } flex-col`}
      >
        <ContactList
          contacts={contacts}
          activeContactId={activeContact?.id || null}
          onSelectContact={handleSelectContact}
          onAddContact={handleAddContact}
          onStartAIChat={handleStartAIChat}
          isLoading={isLoading}
        />
      </aside>
      <section
        className={`h-full flex-1 transition-all duration-300 ${
          activeContact ? 'flex' : 'hidden md:flex'
        } flex-col`}
      >
        {activeContact ? (
          <ChatPanel
            key={activeContact.id} // Add key to force re-mount on contact change
            contact={{...activeContact, messages: currentChatMessages}}
            onSendMessage={handleSendMessage}
            onUpdateMessage={handleUpdateMessage}
            onDeleteMessage={handleDeleteMessage}
            onBack={handleBackToContacts}
            smartReplies={smartReplies}
            setSmartReplies={setSmartReplies}
            isLoading={isMessagesLoading}
          />
        ) : (
           <NoContactsView />
        )}
      </section>
    </div>
  );
}
