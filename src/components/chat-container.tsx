
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Contact, Message, User } from '@/lib/types';
import { ContactList } from '@/components/contact-list';
import { ChatPanel } from '@/components/chat-panel';
import { generateSmartReplies, SmartReplyOutput } from '@/ai/flows/smart-reply-suggestions';
import { generateChatResponse } from '@/ai/flows/conversational-ai-flow';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { ref, onValue, set, push, get, child, remove, query, limitToLast, off, update, type ThenableReference } from 'firebase/database';

const AI_CONTACT_ID = 'ai-assistant';

const AI_CONTACT: Contact = {
    id: AI_CONTACT_ID,
    name: 'AI Assistant',
    avatar: 'https://picsum.photos/seed/ai-robot-abstract-art/100/100',
    online: true,
    lastMessage: 'Ask me to generate media!',
    lastMessageTime: '',
    unreadCount: 0,
    messages: [],
};


// Helper to get a consistent key for a conversation between two users
const getConversationKey = (user1: string, user2: string) => {
  return [user1, user2].sort().join('-');
}

export function ChatContainer() {
  const { user: currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<Record<string, User>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [userContacts, setUserContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [aiChatState, setAiChatState] = useState<Contact>(AI_CONTACT);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [messageCache, setMessageCache] = useState<Record<string, Record<string, Message>>>({});
  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});


  // Fetch all users once
  useEffect(() => {
    if (!currentUser) return;
    const usersRef = ref(db, 'users');
    const listener = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val() || {};
      setAllUsers(usersData);
    }, (error) => {
      console.error("Error fetching users:", error);
    });
    return () => off(usersRef, 'value', listener);
  }, [currentUser]);

  // Listen for the LAST message in each conversation for the contact list preview
  useEffect(() => {
    if (!currentUser || !Object.keys(allUsers).length) return;

    const currentUserContacts = allUsers[currentUser.phoneNumber]?.contacts || [];
    const conversationKeys = currentUserContacts.map((contactId: string) => getConversationKey(currentUser.phoneNumber, contactId));

    const unsubscribers = conversationKeys.map(key => {
      const messagesRef = query(ref(db, `messages/${key}`), limitToLast(1));
      const listener = onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
          const messageData = snapshot.val();
          const lastMessageKey = Object.keys(messageData)[0];
          const lastMessage = messageData[lastMessageKey];
          setLastMessages(prev => ({ ...prev, [key]: lastMessage }));
        }
      });
      return () => off(messagesRef, 'value', listener);
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
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
          online: contactUser.status?.online || false,
          lastSeen: contactUser.status?.lastSeen,
          lastMessage: lastMessage ? (lastMessage.content || (lastMessage.image ? "Image" : '')) : 'No messages yet',
          lastMessageTime: lastMessage ? lastMessage.timestamp : '',
          unreadCount: 0, // This would need a more complex query to be accurate
          messages: [], // We use the cache now, so this can be empty
          isTyping: typingStatus[contactUser.phoneNumber] || false,
        };
      })
      .filter((c): c is Contact => c !== null);
      
    setUserContacts(contactList);

    setIsLoading(false);

  }, [currentUser, allUsers, lastMessages, typingStatus]);

  // Listen for messages and typing status for the active conversation
  useEffect(() => {
      if (activeContact?.id && activeContact.id !== AI_CONTACT_ID && currentUser) {
          const conversationKey = getConversationKey(currentUser.phoneNumber, activeContact.id);
          
          if (!messageCache[conversationKey]) {
            setIsMessagesLoading(true);
          }

          const messagesRef = ref(db, `messages/${conversationKey}`);
          const typingRef = ref(db, `conversations/${conversationKey}/typing`);
          
          const messagesListener = onValue(messagesRef, (snapshot) => {
              const messagesData = snapshot.val() || {};
              setMessageCache(prev => ({...prev, [conversationKey]: messagesData}));

              const updates: Record<string, any> = {};
              Object.entries(messagesData).forEach(([key, message]: [string, any]) => {
                  if (message.sender === activeContact.id && message.status !== 'read') {
                      updates[`/${key}/status`] = 'read';
                  }
              });

              if (Object.keys(updates).length > 0) {
                  update(messagesRef, updates);
              }
              setIsMessagesLoading(false);
          }, (error) => {
              console.error(`Error fetching messages for ${conversationKey}:`, error);
              setIsMessagesLoading(false);
          });
          
          const typingListener = onValue(typingRef, (snapshot) => {
              const typingData = snapshot.val() || {};
              setTypingStatus(prev => ({ ...prev, [activeContact.id]: typingData[activeContact.id] || false }));
          });
          
          return () => {
              off(messagesRef, 'value', messagesListener);
              off(typingRef, 'value', typingListener);
          };
      }
  }, [activeContact?.id, currentUser?.phoneNumber]);

  const handleSelectContact = (contactId: string) => {
    if (contactId === AI_CONTACT_ID) {
        setActiveContact(aiChatState);
        return;
    }
    const contact = userContacts.find(c => c.id === contactId);
    if(contact) {
        const fullContactData = allUsers[contactId];
        const newActiveContact = {...contact};
        if(fullContactData) {
            newActiveContact.online = fullContactData.status?.online || false;
            newActiveContact.lastSeen = fullContactData.status?.lastSeen;
            newActiveContact.isTyping = typingStatus[contactId] || false;
        }
        setActiveContact(newActiveContact);
    }
    setSmartReplies([]);
  };

  const handleAddContact = async (user: User) => {
    if (!currentUser) return;
    
    if(userContacts.some(c => c.id === user.phoneNumber)) {
        handleSelectContact(user.phoneNumber);
        return;
    }
    
    // Add to current user's contact list
    const currentUserContactsRef = ref(db, `users/${currentUser.phoneNumber}/contacts`);
    const snapshot = await get(currentUserContactsRef);
    const currentContacts = snapshot.val() || [];
    if (!currentContacts.includes(user.phoneNumber)) {
      await set(currentUserContactsRef, [...currentContacts, user.phoneNumber]);
    }

    // Add current user to the new contact's list (mutual)
    const newContactContactsRef = ref(db, `users/${user.phoneNumber}/contacts`);
    const newContactSnapshot = await get(newContactContactsRef);
    const newContactCurrentContacts = newContactSnapshot.val() || [];
    if (!newContactCurrentContacts.includes(currentUser.phoneNumber)) {
        await set(newContactContactsRef, [...newContactCurrentContacts, currentUser.phoneNumber]);
    }
    
    // Immediately select the new contact for chatting
    const tempContact: Contact = {
        id: user.phoneNumber,
        name: user.name,
        avatar: user.profilePicture || `https://picsum.photos/seed/${user.phoneNumber}/100/100`,
        online: user.status?.online || false,
        lastMessage: 'Chat started',
        lastMessageTime: '',
        unreadCount: 0,
        messages: [],
    };
    setActiveContact(tempContact);
  };
  
  const handleStartAIChat = () => {
     handleSelectContact(AI_CONTACT_ID);
  };

  const handleBackToContacts = () => {
    setActiveContact(null);
  };

  const getSmartReplies = useCallback(async (contact: Contact, fullMessages: Message[]) => {
    if (!fullMessages.length || !currentUser || contact.id === AI_CONTACT_ID) return;
    const lastMessage = fullMessages[fullMessages.length - 1];
    if (lastMessage.sender === currentUser.phoneNumber || lastMessage.isGenerating) return;

    const conversationHistory = fullMessages
      .slice(-10) // Use last 10 messages for context
      .filter(m => !m.isGenerating && m.content)
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
    
    const currentMessages = aiChatState.messages;

    const conversationHistory = currentMessages
      .filter(m => !m.isGenerating && !m.image && m.content)
      .map(m => `${m.sender === currentUser.phoneNumber ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');

    const lastMessage = currentMessages[currentMessages.length - 1];
    if (!lastMessage || lastMessage.sender !== currentUser.phoneNumber || !lastMessage.content) return;

    const loadingMessage: Message = {
      id: Date.now(),
      content: "Thinking...",
      sender: AI_CONTACT_ID,
      timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
      status: 'read',
      isGenerating: true,
    }

    // Add loading message
    setAiChatState(prev => ({...prev, messages: [...prev.messages, loadingMessage]}));

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
      
      setAiChatState(prev => {
        const cleanedMessages = prev.messages.filter(m => !m.isGenerating);
        const updatedMessages = [...cleanedMessages, aiMessage];
        const updatedContact = { ...prev, messages: updatedMessages, lastMessage: response, lastMessageTime: aiMessage.timestamp };
        setActiveContact(updatedContact); // Update active contact to re-render chat panel
        return updatedContact;
      });

    } catch (error) {
      console.error('Error getting AI response:', error);
       const errorMessage: Message = {
        id: Date.now(),
        content: "Sorry, I couldn't process that request.",
        sender: AI_CONTACT_ID,
        timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
        status: 'read',
      };
       setAiChatState(prev => {
        const cleanedMessages = prev.messages.filter(m => !m.isGenerating);
        const updatedMessages = [...cleanedMessages, errorMessage];
        const updatedContact = { ...prev, messages: updatedMessages };
        setActiveContact(updatedContact); // Update active contact
        return updatedContact;
      });
    }
  }, [currentUser, activeContact?.id, aiChatState.messages]);

  const handleSendMessage = (content: string, media?: string, isGenerating?: boolean): ThenableReference | undefined => {
    if (!activeContact || !currentUser) return;

    const messageId = Date.now(); // Use timestamp for unique ID
    const newMessage: Message = {
      id: messageId,
      content,
      sender: currentUser.phoneNumber,
      timestamp: new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date()),
      status: 'sent',
      ...(media && (media.startsWith('data:video') ? { video: media } : { image: media })),
      ...(isGenerating && { isGenerating }),
    };
    
    if (activeContact.id === AI_CONTACT_ID) {
        const updatedMessages = [...aiChatState.messages.filter(m => !m.isGenerating), newMessage];
        const updatedContact = { ...aiChatState, messages: updatedMessages, lastMessage: content || 'Media', lastMessageTime: newMessage.timestamp };
        setAiChatState(updatedContact);
        setActiveContact(updatedContact); // Ensure active contact is updated to trigger re-render
        return undefined;
    } else {
        const conversationKey = getConversationKey(currentUser.phoneNumber, activeContact.id);
        const messagesRef = ref(db, `messages/${conversationKey}`);
        const newMessageRef = push(messagesRef);
        
        const recipientUser = allUsers[activeContact.id];

        // Create a clean object for the database, removing client-side only properties
        const { db_key, ...dbMessage } = { 
          ...newMessage, 
          status: 'delivered', // Set to delivered on send
          recipientFcmToken: recipientUser?.fcmToken || null,
          senderName: currentUser.name,
        } as Message & {video?: string};

        if (dbMessage.isGenerating === undefined) {
             delete dbMessage.isGenerating;
        }

        set(newMessageRef, dbMessage);
        setSmartReplies([]);
        return newMessageRef;
    }
  };

  const handleUpdateMessage = (dbKey: string, content: string, media?: string, isGenerating?: boolean) => {
    if (!activeContact || !currentUser || activeContact.id === AI_CONTACT_ID) return;
    
    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContact.id);
    const messageToUpdateRef = ref(db, `messages/${conversationKey}/${dbKey}`);
    
    const updatedMessage: any = { content: content };
    if (media !== undefined) {
      if (media.startsWith('data:video')) {
        updatedMessage.video = media;
        delete updatedMessage.image;
      } else {
        updatedMessage.image = media;
        delete updatedMessage.video;
      }
    }
    
    // Use null to remove the key from Firebase
    updatedMessage.isGenerating = isGenerating === true ? true : null;

    update(messageToUpdateRef, updatedMessage);
  }

  const handleDeleteMessage = (messageId: number, dbKey?: string) => {
    if (!activeContact || !currentUser) return;
    
    if (activeContact.id === AI_CONTACT_ID) {
        const updatedMessages = aiChatState.messages.filter(m => m.id !== messageId);
        const updatedContact = { ...aiChatState, messages: updatedMessages };
        setAiChatState(updatedContact);
        setActiveContact(updatedContact);
    } else {
        if (!dbKey) {
            console.error("Cannot delete message without a database key.");
            return;
        }
        const conversationKey = getConversationKey(currentUser.phoneNumber, activeContact.id);
        const messageRef = ref(db, `messages/${conversationKey}/${dbKey}`);
        remove(messageRef);
    }
  }

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTypingChange = (isTyping: boolean) => {
    if (!currentUser || !activeContact || activeContact.id === AI_CONTACT_ID) return;

    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }

    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContact.id);
    const typingRef = ref(db, `conversations/${conversationKey}/typing/${currentUser.phoneNumber}`);
    
    if (isTyping) {
        set(typingRef, true);
        typingTimeoutRef.current = setTimeout(() => {
            set(typingRef, null); // Use null to remove from DB
        }, 2000); // 2 second timeout
    } else {
        set(typingRef, null);
    }
  };
  
  const currentChatMessages = useMemo(() => {
    if (!activeContact || !currentUser) return [];
    if (activeContact.id === AI_CONTACT_ID) {
        return aiChatState.messages;
    }
    
    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContact.id);
    const cachedMessages = messageCache[conversationKey] || {};

    return Object.entries(cachedMessages)
      .map(([key, value]) => ({ ...value, db_key: key }))
      .sort((a,b) => a.id - b.id);
  }, [activeContact, currentUser, messageCache, aiChatState.messages]);

  useEffect(() => {
    if (activeContact && currentChatMessages.length > 0) {
      if (activeContact.id === AI_CONTACT_ID) {
        getAIResponse();
      } else {
        getSmartReplies(activeContact, currentChatMessages);
      }
    }
  }, [activeContact, currentChatMessages.length, getAIResponse, getSmartReplies]);


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
  
  const contactsForList = useMemo(() => [aiChatState, ...userContacts].sort((a, b) => {
    const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
    const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
    return timeB - timeA;
  }), [aiChatState, userContacts]);

  return (
    <div className="flex h-full w-full">
      <aside
        className={`h-full w-full flex-shrink-0 transition-all duration-300 md:w-2/5 md:flex-shrink-0 lg:w-1/3 xl:w-1/4 ${
          activeContact ? 'hidden md:flex' : 'flex'
        } flex-col`}
      >
        <ContactList
          contacts={contactsForList}
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
            onTypingChange={handleTypingChange}
          />
        ) : (
           <NoContactsView />
        )}
      </section>
    </div>
  );
}

    