
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
import { useToast } from '@/hooks/use-toast';

const AI_CONTACT_ID = 'ai-assistant';


// Helper to get a consistent key for a conversation between two users
const getConversationKey = (user1: string, user2: string) => {
  return [user1, user2].sort().join('-');
}

export function ChatContainer() {
  const { user: currentUser } = useAuth();
  const [allUsers, setAllUsers] = useState<Record<string, User>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [messageCache, setMessageCache] = useState<Record<string, Record<string, Message>>>({});
  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();


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

  const currentUserContactIds = useMemo(() => {
    if (!currentUser?.phoneNumber || !allUsers[currentUser.phoneNumber]) return [];
    return allUsers[currentUser.phoneNumber].contacts || [];
  }, [currentUser?.phoneNumber, allUsers]);

  // Listen for the LAST message in each conversation for the contact list preview
  useEffect(() => {
    if (!currentUser?.phoneNumber) return;
    
    // Combine user contacts with the static AI contact
    const contactIds = [...currentUserContactIds, AI_CONTACT_ID];
    
    const unsubscribers = contactIds.map((contactId: string) => {
      const conversationKey = getConversationKey(currentUser.phoneNumber, contactId);
      const messagesRef = query(ref(db, `messages/${conversationKey}`), limitToLast(1));
      
      const lastMsgListener = onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
          const messagesData = snapshot.val();
          const lastMsgKey = Object.keys(messagesData)[0];
          const lastMsg = messagesData[lastMsgKey];
          setLastMessages(prev => ({ ...prev, [conversationKey]: lastMsg as Message }));
        }
      });
      
      const unreadRef = ref(db, `messages/${conversationKey}`);
      const unreadListener = onValue(unreadRef, (snapshot) => {
          if (snapshot.exists()) {
              let unread = 0;
              snapshot.forEach((childSnapshot) => {
                  const msg = childSnapshot.val();
                   if (msg.sender !== currentUser.phoneNumber && msg.status !== 'read') {
                      unread++;
                   }
              });
              setUnreadCounts(prev => ({ ...prev, [conversationKey]: unread }));
          }
      });


      return () => {
        off(messagesRef, 'value', lastMsgListener);
        off(unreadRef, 'value', unreadListener);
      }
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser?.phoneNumber, currentUserContactIds]);

  const aiChatState: Contact = useMemo(() => {
    if (!currentUser) return {} as Contact; // Should not happen if logged in
    const conversationKey = getConversationKey(currentUser.phoneNumber, AI_CONTACT_ID);
    const lastMessage = lastMessages[conversationKey];
    
    return {
        id: AI_CONTACT_ID,
        name: 'AI Assistant',
        avatar: 'https://picsum.photos/seed/ai-robot-abstract-art/100/100',
        online: true,
        lastMessage: lastMessage?.content || 'Ask me to generate media!',
        lastMessageTime: lastMessage?.timestamp || new Date(Date.now() - 60000).toISOString(),
        unreadCount: unreadCounts[conversationKey] || 0,
    };
  }, [currentUser, lastMessages, unreadCounts]);

  const userContacts: Contact[] = useMemo(() => {
    if (!currentUser?.phoneNumber || !Object.keys(allUsers).length) {
      return [];
    }

    const currentUserData = allUsers[currentUser.phoneNumber];
    if (!currentUserData || !currentUserData.contacts) {
      return [];
    }

    return currentUserData.contacts
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
          lastMessage: lastMessage ? (lastMessage.content || (lastMessage.image ? "Image" : (lastMessage.video ? "Video" : ''))) : 'No messages yet',
          lastMessageTime: lastMessage?.timestamp || '',
          unreadCount: unreadCounts[conversationKey] || 0, 
          isTyping: typingStatus[contactUser.phoneNumber] || false,
        };
      })
      .filter((c): c is Contact => c !== null);
  }, [currentUser?.phoneNumber, allUsers, lastMessages, typingStatus, unreadCounts]);


  useEffect(() => {
    if (currentUser && Object.keys(allUsers).length > 0) {
        setIsLoading(false);
    }
  }, [currentUser, allUsers]);


  // Listen for messages and typing status for the active conversation
  useEffect(() => {
      if (!activeContactId || !currentUser?.phoneNumber) return;
      
      const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
      
      if (!messageCache[conversationKey]) {
        setIsMessagesLoading(true);
      }

      const messagesRef = ref(db, `messages/${conversationKey}`);
      const typingRef = activeContactId !== AI_CONTACT_ID ? ref(db, `conversations/${conversationKey}/typing/${activeContactId}`) : null;
      
      const messagesListener = onValue(messagesRef, (snapshot) => {
          const messagesData = snapshot.val() || {};
          // Update the cache for this specific conversation
          setMessageCache(prev => ({...prev, [conversationKey]: messagesData}));

          // Mark messages as read
          const updates: Record<string, any> = {};
          Object.entries(messagesData).forEach(([key, message]: [string, any]) => {
              if (message.sender === activeContactId && message.status !== 'read') {
                  updates[`${key}/status`] = 'read';
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
      
      let typingListener: any;
      if (typingRef) {
        typingListener = onValue(typingRef, (snapshot) => {
            const isOpponentTyping = snapshot.val() || false;
            setTypingStatus(prev => ({ ...prev, [activeContactId]: isOpponentTyping }));
        });
      }
      
      return () => {
          off(messagesRef, 'value', messagesListener);
          if (typingRef && typingListener) {
            off(typingRef, 'value', typingListener);
          }
      };
  }, [activeContactId, currentUser?.phoneNumber]);

  const handleSelectContact = (contactId: string) => {
    setActiveContactId(contactId);
    setSmartReplies([]);
  };

  const handleAddContact = async (user: User) => {
    if (!currentUser) return;
    
    if(userContacts.some(c => c.id === user.phoneNumber)) {
        handleSelectContact(user.phoneNumber);
        return;
    }
    
    // Add new contact to current user's list
    const currentUserContactsRef = ref(db, `users/${currentUser.phoneNumber}/contacts`);
    const currentUserSnapshot = await get(currentUserContactsRef);
    const currentUserContacts = currentUserSnapshot.val() || [];
    if (!currentUserContacts.includes(user.phoneNumber)) {
      await set(currentUserContactsRef, [...currentUserContacts, user.phoneNumber]);
    }

    // Add current user to the new contact's list
    const newContactContactsRef = ref(db, `users/${user.phoneNumber}/contacts`);
    const newContactSnapshot = await get(newContactContactsRef);
    const newContactCurrentContacts = newContactSnapshot.val() || [];
    if (!newContactCurrentContacts.includes(currentUser.phoneNumber)) {
        await set(newContactContactsRef, [...newContactCurrentContacts, currentUser.phoneNumber]);
    }
    
    handleSelectContact(user.phoneNumber);
  };
  
  const handleBackToContacts = () => {
    setActiveContactId(null);
  };
  
   const handleDeleteContact = async (contactId: string) => {
    if (!currentUser) return;
    
    try {
        // Remove contact from current user's list
        const currentUserContactsRef = ref(db, `users/${currentUser.phoneNumber}/contacts`);
        const currentUserSnapshot = await get(currentUserContactsRef);
        const currentUserContacts = (currentUserSnapshot.val() || []).filter((id: string) => id !== contactId);
        await set(currentUserContactsRef, currentUserContacts);
        
        // Remove current user from the other contact's list
        const otherUserContactsRef = ref(db, `users/${contactId}/contacts`);
        const otherUserSnapshot = await get(otherUserContactsRef);
        const otherUserContacts = (otherUserSnapshot.val() || []).filter((id: string) => id !== currentUser.phoneNumber);
        await set(otherUserContactsRef, otherUserContacts);

        if (activeContactId === contactId) {
            setActiveContactId(null);
        }

        toast({ title: "Chat Deleted", description: "The chat has been successfully deleted." });

    } catch (error) {
        console.error("Error deleting contact:", error);
        toast({ title: "Error", description: "Could not delete the chat. Please try again.", variant: "destructive" });
    }
   };

  const activeContactUser = useMemo(() => {
    if (!activeContactId) return null;
    if (activeContactId === AI_CONTACT_ID) return aiChatState;
    const user = allUsers[activeContactId];
    if (!user) return null;

    // Create a Contact object for the header, using last message data
    const conversationKey = getConversationKey(currentUser!.phoneNumber, activeContactId);
    const lastMessage = lastMessages[conversationKey];

    return {
        id: user.phoneNumber,
        name: user.name,
        avatar: user.profilePicture || `https://picsum.photos/seed/${activeContactId}/100/100`,
        online: user.status?.online || false,
        lastSeen: user.status?.lastSeen,
        isTyping: typingStatus[user.phoneNumber] || false,
        lastMessage: lastMessage?.content || '', // Not strictly needed for header
        lastMessageTime: lastMessage?.timestamp || '', // Not strictly needed for header
        unreadCount: 0,
    };
  }, [activeContactId, allUsers, aiChatState, currentUser, lastMessages, typingStatus]);


  const getSmartReplies = useCallback(async (contact: User, fullMessages: Message[]) => {
    if (!fullMessages.length || !currentUser || contact.phoneNumber === AI_CONTACT_ID) return;
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
        userId: currentUser.phoneNumber,
      });
      setSmartReplies(result.suggestions);
    } catch (error) {
      console.error('Error generating smart replies:', error);
      setSmartReplies([]);
    }
  }, [currentUser]);
  
  const getAIResponse = useCallback(async (currentMessages: Message[]) => {
    if (!currentUser || activeContactId !== AI_CONTACT_ID) return;
    
    const lastMessage = currentMessages[currentMessages.length - 1];
    if (!lastMessage || lastMessage.sender !== currentUser.phoneNumber || !lastMessage.content || lastMessage.isGenerating) return;
    
    const conversationHistory = currentMessages
      .filter(m => !m.isGenerating && !m.image && m.content)
      .map(m => `${m.sender === currentUser.phoneNumber ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');


    const conversationKey = getConversationKey(currentUser.phoneNumber, AI_CONTACT_ID);
    const messagesRef = ref(db, `messages/${conversationKey}`);
    const loadingMessageRef = push(messagesRef);

    await set(loadingMessageRef, {
      content: "Thinking...",
      sender: AI_CONTACT_ID,
      timestamp: new Date().toISOString(),
      status: 'read',
      isGenerating: true,
    });

    try {
      const { response } = await generateChatResponse({
        message: lastMessage.content,
        conversationHistory,
        userId: currentUser.phoneNumber,
      });

      const aiMessage: Omit<Message, 'id'> = {
        content: response,
        sender: AI_CONTACT_ID,
        timestamp: new Date().toISOString(),
        status: 'read',
      };
      
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, aiMessage);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
       const errorMessage: Omit<Message, 'id'> = {
        content: "Sorry, I couldn't process that request.",
        sender: AI_CONTACT_ID,
        timestamp: new Date().toISOString(),
        status: 'read',
      };
      const newErrorMessageRef = push(messagesRef);
      await set(newErrorMessageRef, errorMessage);
    } finally {
        const snapshot = await get(messagesRef);
        if (snapshot.exists()) {
            const messages = snapshot.val();
            for (const key in messages) {
                if (messages[key].isGenerating) {
                    await remove(ref(db, `messages/${conversationKey}/${key}`));
                }
            }
        }
    }
  }, [currentUser, activeContactId]);

  const handleSendMessage = (content: string, media?: string, isGenerating?: boolean): ThenableReference | undefined => {
    if (!activeContactId || !currentUser) return;

    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
    const messagesRef = ref(db, `messages/${conversationKey}`);
    
    const recipient = allUsers[activeContactId];
    
    const dbMessage: Omit<Message, 'id' | 'db_key'> & {senderName: string, recipientFcmToken?: string} = {
      content,
      sender: currentUser.phoneNumber,
      senderName: currentUser.name,
      timestamp: new Date().toISOString(),
      status: recipient?.status?.online ? 'delivered' : 'sent',
      ...(media && (media.startsWith('data:video') ? { video: media } : { image: media })),
      ...(isGenerating && { isGenerating }),
      ...(recipient?.fcmToken && { recipientFcmToken: recipient.fcmToken }),
    };
    
    const newMessageRef = push(messagesRef, dbMessage);

    setSmartReplies([]);
    return newMessageRef;
  };

  const handleUpdateMessage = (dbKey: string, content: string, media?: string, isGenerating?: boolean) => {
    if (!activeContactId || !currentUser) return;
    
    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
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
    
    updatedMessage.isGenerating = isGenerating === true ? true : null;

    update(messageToUpdateRef, updatedMessage);
  }

  const handleDeleteMessage = (dbKey?: string) => {
    if (!activeContactId || !currentUser || !dbKey) {
        console.error("Cannot delete message without a database key.");
        return;
    }
    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
    const messageRef = ref(db, `messages/${conversationKey}/${dbKey}`);
    remove(messageRef);
  }

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTypingChange = (isTyping: boolean) => {
    if (!currentUser || !activeContactId || activeContactId === AI_CONTACT_ID) return;

    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }

    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
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
    if (!activeContactId || !currentUser) return [];
    
    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
    const cachedMessages = messageCache[conversationKey] || {};

    return Object.entries(cachedMessages)
      .map(([key, value]) => ({ ...value, db_key: key, id: new Date(value.timestamp).getTime() }))
      .sort((a,b) => a.id - b.id);
  }, [activeContactId, currentUser, messageCache]);

  useEffect(() => {
    if (activeContactUser && currentChatMessages.length > 0) {
      if (activeContactUser.id === AI_CONTACT_ID) {
        getAIResponse(currentChatMessages);
      } else {
        // Since activeContactUser is a Contact, we need to find the full User object
        const fullContactUser = allUsers[activeContactUser.id];
        if (fullContactUser) {
           getSmartReplies(fullContactUser, currentChatMessages);
        }
      }
    }
  }, [currentChatMessages, getAIResponse, getSmartReplies, allUsers, activeContactUser]);


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
          activeContactId ? 'hidden md:flex' : 'flex'
        } flex-col`}
      >
        <ContactList
          contacts={[aiChatState, ...userContacts]}
          activeContactId={activeContactId}
          onSelectContact={handleSelectContact}
          onAddContact={handleAddContact}
          onDeleteContact={handleDeleteContact}
          isLoading={isLoading}
        />
      </aside>
      <section
        className={`h-full flex-1 transition-all duration-300 ${
          activeContactId ? 'flex' : 'hidden md:flex'
        } flex-col`}
      >
        {activeContactId ? (
          <ChatPanel
            key={activeContactId}
            contactId={activeContactId}
            messages={currentChatMessages}
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

    