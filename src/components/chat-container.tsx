
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
          online: contactUser.status?.online || false,
          lastSeen: contactUser.status?.lastSeen,
          lastMessage: lastMessage ? (lastMessage.content || (lastMessage.image ? "Image" : '')) : 'No messages yet',
          lastMessageTime: lastMessage ? lastMessage.timestamp : '',
          unreadCount: 0, // This would need a more complex query to be accurate
          messages: [], // We use the cache now, so this can be empty
        };
      })
      .filter((c): c is Contact => c !== null);
      
    setUserContacts(contactList);

    setIsLoading(false);

  }, [currentUser, allUsers, lastMessages]);

  useEffect(() => {
      if (activeContact?.id && activeContact.id !== AI_CONTACT_ID && currentUser) {
          const conversationKey = getConversationKey(currentUser.phoneNumber, activeContact.id);
          
          if (messageCache[conversationKey]) {
            setIsMessagesLoading(false);
          } else {
            setIsMessagesLoading(true);
          }

          const messagesRef = ref(db, `messages/${conversationKey}`);
          
          const unsubscribe = onValue(messagesRef, (snapshot) => {
              const messagesData = snapshot.val() || {};
              setMessageCache(prev => ({...prev, [conversationKey]: messagesData}));

              // Mark messages as read
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
          }, { onlyOnce: false }); // Ensure it's a persistent listener
          
          return () => unsubscribe();
      }
  }, [activeContact?.id, currentUser, messageCache]); // Rerun when active contact changes

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
    
    // We don't call handleSelectContact here because the useEffect for allUsers will
    // trigger a re-render and add the new user to the contact list naturally.
    // We can setActiveContact with a temporary object though, to show the new chat immediately.
    const tempContact: Contact = {
        id: user.phoneNumber,
        name: user.name,
        avatar: user.profilePicture || `https://picsum.photos/seed/${user.phoneNumber}/100/100`,
        online: true,
        lastMessage: '',
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
    
    const currentMessages = aiChatState.messages;

    const conversationHistory = currentMessages
      .filter(m => !m.isGenerating && !m.image)
      .map(m => `${m.sender === currentUser.phoneNumber ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');

    const lastMessage = currentMessages[currentMessages.length - 1];
    // Only respond if the last message was from the user and was not a media generation request
    if (!lastMessage || lastMessage.sender !== currentUser.phoneNumber || lastMessage.image) return;

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
        setActiveContact(updatedContact); // also update active contact
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
        setActiveContact(updatedContact);
        return updatedContact;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, activeContact, aiChatState.messages]);

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
        const updatedMessages = [...aiChatState.messages.filter(m => !m.isGenerating), newMessage];
        const updatedContact = { ...aiChatState, messages: updatedMessages, lastMessage: content || 'Image', lastMessageTime: newMessage.timestamp };
        setAiChatState(updatedContact);
        setActiveContact(updatedContact);
        return undefined;
    } else {
        const conversationKey = getConversationKey(currentUser.phoneNumber, activeContact.id);
        const messagesRef = ref(db, `messages/${conversationKey}`);
        const newMessageRef = push(messagesRef);
        
        const recipientUser = allUsers[activeContact.id];

        const dbMessage: any = { 
          ...newMessage, 
          status: 'delivered', // Set to delivered on send
          recipientFcmToken: recipientUser?.fcmToken || null,
          senderName: currentUser.name,
        }; 
        if (dbMessage.image === undefined) delete dbMessage.image;
        if (dbMessage.isGenerating === undefined) delete dbMessage.isGenerating;
        
        set(newMessageRef, { ...dbMessage, db_key: newMessageRef.key });

        setSmartReplies([]);
        return newMessageRef;
    }
  };

  const handleUpdateMessage = (dbKey: string, content: string, image?: string, isGenerating?: boolean) => {
    if (!activeContact || !currentUser || activeContact.id === AI_CONTACT_ID) return;
    
    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContact.id);
    const messageToUpdateRef = ref(db, `messages/${conversationKey}/${dbKey}`);
    
    get(messageToUpdateRef).then((snapshot) => {
        if (snapshot.exists()) {
            const dbMessage = snapshot.val();
            
            const updatedMessage: any = { ...dbMessage, content: content };
            
            if (image !== undefined) updatedMessage.image = image;

            if (isGenerating === false) {
              delete updatedMessage.isGenerating;
            } else if (isGenerating === true) {
              updatedMessage.isGenerating = true;
            }

            set(messageToUpdateRef, updatedMessage);
        }
    });
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContact, currentChatMessages.length]);


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
  
  const contactsForList = useMemo(() => [aiChatState, ...userContacts], [aiChatState, userContacts]);

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
          />
        ) : (
           <NoContactsView />
        )}
      </section>
    </div>
  );
}

    