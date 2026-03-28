
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Contact, Message, PublicUser } from '@/lib/types';
import { addContact, removeContact } from '@/ai/flows/contact-management-flow';
import { ContactList } from '@/components/contact-list';
import { ChatPanel } from '@/components/chat-panel';
import { generateSmartReplies, SmartReplyOutput } from '@/ai/flows/smart-reply-suggestions';
import { generateChatResponse } from '@/ai/flows/conversational-ai-flow';
import { sendPushNotification } from '@/ai/flows/push-notification-flow';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db, auth } from '@/lib/firebase';
import { normalizeContactIds } from '@/lib/contacts';
import { getPublicUser, subscribeToPublicUser } from '@/lib/public-user';
import { ref, onValue, set, push, get, remove, query, limitToLast, off, update, type ThenableReference } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { BroadcastBanner } from './broadcast-banner';

const AI_CONTACT_ID = 'ai-assistant';


// Helper to get a consistent key for a conversation between two users
const getConversationKey = (user1: string, user2: string) => {
  return [user1, user2].sort().join('-');
}

const getMediaPayload = (media?: string) => {
  if (!media) {
    return {};
  }

  if (media.startsWith('data:audio')) {
    return { audio: media };
  }

  if (media.startsWith('data:video') || /\.(mp4|mov|avi|mkv)(?:$|[?#])/i.test(media)) {
    return { video: media };
  }

  return { image: media };
};

const getMessagePreview = (message?: Message) => {
  if (!message) {
    return 'No messages yet';
  }

  if (message.content) {
    return message.content;
  }

  if (message.audio) {
    return 'Voice note';
  }

  if (message.video) {
    return 'Video';
  }

  if (message.image) {
    return 'Image';
  }

  return '';
};

export function ChatContainer({ initialContactId }: { initialContactId?: string | null }) {
  const { user: currentUser, sessionToken } = useAuth();
  const router = useRouter();
  const [contactUsers, setContactUsers] = useState<Record<string, PublicUser>>({});
  const [currentUserContacts, setCurrentUserContacts] = useState<string[]>([]);
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [messageCache, setMessageCache] = useState<Record<string, Record<string, Message>>>({});
  const messageCacheRef = useRef<Record<string, Record<string, Message>>>({});
  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const initialContactAppliedRef = useRef(false);

  const openChat = useCallback(
    (contactId: string) => {
      setActiveContactId(contactId);
      setSmartReplies([]);
      router.push(`/?contact=${encodeURIComponent(contactId)}`);
    },
    [router]
  );

  useEffect(() => {
    messageCacheRef.current = messageCache;
  }, [messageCache]);


  // Fetch the current user's contact ids.
  useEffect(() => {
    if (!currentUser?.phoneNumber) return;

    setIsLoading(true);
    const contactsRef = ref(db, `users/${currentUser.phoneNumber}/contacts`);

    const contactsListener = onValue(contactsRef, (snapshot) => {
        setCurrentUserContacts(normalizeContactIds(snapshot.val()));
        setIsLoading(false);
    });

    return () => {
      off(contactsRef, 'value', contactsListener);
    };
  }, [currentUser?.phoneNumber]);

  useEffect(() => {
    const uniqueContactIds = [...new Set(currentUserContacts)];
    setContactUsers((prev) =>
      Object.fromEntries(
        Object.entries(prev).filter(
          ([contactId]) =>
            uniqueContactIds.includes(contactId) || contactId === activeContactId
        )
      )
    );

    const cleanups = uniqueContactIds.map((contactId) =>
      subscribeToPublicUser(contactId, (user) => {
        setContactUsers((prev) => {
          if (!user) {
            const nextUsers = { ...prev };
            delete nextUsers[contactId];
            return nextUsers;
          }

          return { ...prev, [contactId]: user };
        });
      })
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [activeContactId, currentUserContacts]);

  useEffect(() => {
    if (!currentUser?.phoneNumber) return;

    let cleanupConversationListeners = () => {};

    const setupConversationListeners = (contactIds: string[]) => {
      const listenerRefs = contactIds.flatMap((contactId) => {
        const conversationKey = getConversationKey(currentUser.phoneNumber, contactId);
        const messagesRef = query(ref(db, `messages/${conversationKey}`), limitToLast(1));
        const unreadRef = ref(db, `messages/${conversationKey}`);

        const lastMsgListener = onValue(messagesRef, (msgSnapshot) => {
          if (msgSnapshot.exists()) {
            const messagesData = msgSnapshot.val();
            const lastMsgKey = Object.keys(messagesData)[0];
            const lastMsg = messagesData[lastMsgKey];
            setLastMessages((prev) => ({ ...prev, [conversationKey]: lastMsg as Message }));
          } else {
            setLastMessages((prev) => {
              const next = { ...prev };
              delete next[conversationKey];
              return next;
            });
          }
        }, () => { /* handle error */ });

        const unreadListener = onValue(unreadRef, (unreadSnapshot) => {
          let unread = 0;
          if (unreadSnapshot.exists()) {
            unreadSnapshot.forEach((childSnapshot) => {
              const msg = childSnapshot.val();
              if (msg.sender !== currentUser.phoneNumber && msg.status !== 'read' && !msg.isGenerating) {
                unread++;
              }
            });
          }
          setUnreadCounts((prev) => ({ ...prev, [conversationKey]: unread }));
        }, () => { /* handle error */ });

        return [
          { ref: messagesRef, listener: lastMsgListener, type: 'value' as const },
          { ref: unreadRef, listener: unreadListener, type: 'value' as const },
        ];
      });

      return () => {
        listenerRefs.forEach(({ ref, listener, type }) => off(ref, type, listener));
      };
    };
    cleanupConversationListeners();
    cleanupConversationListeners = setupConversationListeners([
      ...new Set([...currentUserContacts, AI_CONTACT_ID]),
    ]);

    return () => {
      cleanupConversationListeners();
    };
  }, [currentUser?.phoneNumber, currentUserContacts]);


  const aiChatState: Contact = useMemo(() => {
    if (!currentUser) return {} as Contact; // Should not happen if logged in
    const conversationKey = getConversationKey(currentUser.phoneNumber, AI_CONTACT_ID);
    const lastMessage = lastMessages[conversationKey];
    
    return {
        id: AI_CONTACT_ID,
        name: 'AI Assistant',
        avatar: '/robot-icon.svg',
        online: true,
        lastMessage: lastMessage ? getMessagePreview(lastMessage) : 'Ask me to generate media!',
        lastMessageTime: lastMessage?.timestamp || new Date(Date.now() - 60000).toISOString(),
        unreadCount: unreadCounts[conversationKey] || 0,
    };
  }, [currentUser, lastMessages, unreadCounts]);

  const userContacts: Contact[] = useMemo(() => {
    if (!currentUser?.phoneNumber) {
      return [];
    }

    const visibleContactIds = [...currentUserContacts];
    if (
      activeContactId &&
      activeContactId !== AI_CONTACT_ID &&
      activeContactId !== currentUser.phoneNumber &&
      !visibleContactIds.includes(activeContactId) &&
      contactUsers[activeContactId]
    ) {
      visibleContactIds.unshift(activeContactId);
    }

    return visibleContactIds.flatMap((contactId) => {
        const contactUser = contactUsers[contactId];
        if (!contactUser) return [];

        const conversationKey = getConversationKey(currentUser.phoneNumber, contactId);
        const lastMessage = lastMessages[conversationKey];

        return [{
          id: contactId,
          name: contactUser.name,
          avatar: contactUser.profilePicture || `https://picsum.photos/seed/${contactId}/100/100`,
          online: contactUser.status?.online || false,
          lastSeen: contactUser.status?.lastSeen,
          lastMessage: getMessagePreview(lastMessage),
          lastMessageTime: lastMessage?.timestamp || '',
          unreadCount: unreadCounts[conversationKey] || 0, 
          isTyping: typingStatus[contactId] || false,
        }];
      });
  }, [activeContactId, currentUser?.phoneNumber, currentUserContacts, contactUsers, lastMessages, typingStatus, unreadCounts]);


  // Listen for messages and typing status for the active conversation
  useEffect(() => {
      if (!activeContactId || !currentUser?.phoneNumber) return;
      
      const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
      
      if (!messageCacheRef.current[conversationKey]) {
        setIsMessagesLoading(true);
      }

      const messagesRef = ref(db, `messages/${conversationKey}`);
      const typingRef = activeContactId !== AI_CONTACT_ID ? ref(db, `conversations/${conversationKey}/typing/${activeContactId}`) : null;
      
      const detachMessagesListener = onValue(messagesRef, (snapshot) => {
          const messagesData = (snapshot.val() || {}) as Record<string, Message>;
          // Update the cache for this specific conversation
          setMessageCache(prev => ({...prev, [conversationKey]: messagesData}));

          // Mark messages as read
          const updates: Record<string, 'read'> = {};
          Object.entries(messagesData).forEach(([key, message]) => {
              if (message.sender === activeContactId && message.status !== 'read') {
                  updates[`messages/${conversationKey}/${key}/status`] = 'read';
              }
          });

          if (Object.keys(updates).length > 0) {
              update(ref(db), updates);
          }
          setIsMessagesLoading(false);
      }, (error) => {
          console.error(`Error fetching messages for ${conversationKey}:`, error);
          setIsMessagesLoading(false);
      });
      
      let detachTypingListener: (() => void) | undefined;
      if (typingRef) {
        detachTypingListener = onValue(typingRef, (snapshot) => {
            const isOpponentTyping = snapshot.val() || false;
            setTypingStatus(prev => ({ ...prev, [activeContactId]: isOpponentTyping }));
        });
      }
      
      return () => {
          detachMessagesListener();
          detachTypingListener?.();
      };
  }, [activeContactId, currentUser?.phoneNumber]);

  const handleSelectContact = (contactId: string) => {
    openChat(contactId);
  };

  const handleAddContact = async (user: PublicUser) => {
    if (!currentUser) return;
    
    if(userContacts.some(c => c.id === user.phoneNumber)) {
        openChat(user.phoneNumber);
        return;
    }

    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken && !sessionToken) {
        throw new Error('Your session expired. Please sign in again.');
      }

      const result = await addContact({
        idToken: idToken ?? undefined,
        sessionToken: sessionToken ?? undefined,
        contactPhoneNumber: user.phoneNumber,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      setContactUsers((prev) => ({
        ...prev,
        [user.phoneNumber]: user,
      }));
      setCurrentUserContacts((prev) =>
        prev.includes(user.phoneNumber) ? prev : [...prev, user.phoneNumber]
      );
      openChat(user.phoneNumber);
      toast({
        title: 'Contact added',
        description: `${user.name} is now in your chats.`,
      });
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({
        title: 'Could not add contact',
        description:
          error instanceof Error
            ? error.message
            : 'Please try again in a moment.',
        variant: 'destructive',
      });
    }
  };
  
  const handleBackToContacts = () => {
    setActiveContactId(null);
    router.push('/');
  };

  const handleShowSettings = () => {
    router.push('/?page=settings');
  };
  
   const handleDeleteContact = async (contactId: string) => {
    if (!currentUser) return;
    
    try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken && !sessionToken) {
          throw new Error('Your session expired. Please sign in again.');
        }

        const result = await removeContact({
          idToken: idToken ?? undefined,
          sessionToken: sessionToken ?? undefined,
          contactPhoneNumber: contactId,
        });

        if (!result.success) {
          throw new Error(result.message);
        }

        if (activeContactId === contactId) {
            setActiveContactId(null);
            router.push('/');
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
    const user = contactUsers[activeContactId];
    if (!user) return null;

    // Create a Contact object for the header, using last message data
    const conversationKey = getConversationKey(currentUser!.phoneNumber, activeContactId);
    const lastMessage = lastMessages[conversationKey];

    return {
        id: activeContactId,
        name: user.name,
        avatar: user.profilePicture || `https://picsum.photos/seed/${activeContactId}/100/100`,
        online: user.status?.online || false,
        lastSeen: user.status?.lastSeen,
        isTyping: typingStatus[activeContactId] || false,
        lastMessage: lastMessage?.content || '', // Not strictly needed for header
        lastMessageTime: lastMessage?.timestamp || '', // Not strictly needed for header
        unreadCount: 0,
    };
  }, [activeContactId, contactUsers, aiChatState, currentUser, lastMessages, typingStatus]);


  const getSmartReplies = useCallback(async (contact: PublicUser, fullMessages: Message[]) => {
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
    
    const lastMessage = currentMessages[currentMessages.length - 1];

    try {
      const { response } = await generateChatResponse({
        message: lastMessage.content || "",
        conversationHistory,
        userId: currentUser.phoneNumber,
      });

      const aiMessage: Omit<Message, 'id'> = {
        content: response,
        sender: AI_CONTACT_ID,
        timestamp: new Date().toISOString(),
        status: 'read',
      };
      
      push(messagesRef, aiMessage);
      
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
    
    const dbMessage: Omit<Message, 'id' | 'db_key'> = {
      content,
      sender: currentUser.phoneNumber,
      timestamp: new Date().toISOString(),
      status: contactUsers[activeContactId]?.status?.online ? 'delivered' : 'sent',
      ...getMediaPayload(media),
      ...(isGenerating && { isGenerating }),
    };
    
    const newMessageRef = push(messagesRef, dbMessage);

    if (!isGenerating && activeContactId !== AI_CONTACT_ID) {
      void sendPushNotification({
        recipientPhoneNumber: activeContactId,
        senderPhoneNumber: currentUser.phoneNumber,
        senderName: currentUser.name,
        message: content,
      }).catch((error) => {
        console.error('Failed to send push notification:', error);
      });
    }

    const newMessages = [...currentChatMessages, { ...dbMessage, id: Date.now(), db_key: newMessageRef.key! }];

    if(activeContactId === AI_CONTACT_ID && dbMessage.content) {
      getAIResponse(newMessages);
    } else if (activeContactId !== AI_CONTACT_ID) {
      setSmartReplies([]);
    }

    return newMessageRef;
  };

  const handleUpdateMessage = (dbKey: string, content: string, media?: string, isGenerating?: boolean) => {
    if (!activeContactId || !currentUser) return;
    
    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
    const messageToUpdateRef = ref(db, `messages/${conversationKey}/${dbKey}`);
    
    const updatedMessage: Record<string, string | boolean | null> = { content };
    if (media !== undefined) {
      updatedMessage.image = null;
      updatedMessage.video = null;
      updatedMessage.audio = null;
      Object.assign(updatedMessage, getMediaPayload(media));
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
      if (activeContactUser.id !== AI_CONTACT_ID) {
        const fullContactUser = contactUsers[activeContactUser.id];
        if (fullContactUser) {
           getSmartReplies(fullContactUser, currentChatMessages);
        }
      }
    }
  }, [currentChatMessages, getSmartReplies, contactUsers, activeContactUser]);

  useEffect(() => {
    if (initialContactAppliedRef.current || !initialContactId || !currentUser?.phoneNumber) {
      return;
    }

    const availableIds = new Set([...currentUserContacts, AI_CONTACT_ID]);
    if (!availableIds.has(initialContactId)) {
      if (initialContactId === currentUser.phoneNumber) {
        initialContactAppliedRef.current = true;
        return;
      }

      void getPublicUser(initialContactId).then((user) => {
        if (!user) {
          return;
        }

        setContactUsers((prev) => ({
          ...prev,
          [initialContactId]: user,
        }));
        setActiveContactId(initialContactId);
        initialContactAppliedRef.current = true;
      });
      return;
    }

    setActiveContactId(initialContactId);
    initialContactAppliedRef.current = true;
  }, [initialContactId, currentUser?.phoneNumber, currentUserContacts]);


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
    <div className="flex h-full w-full flex-col">
       <BroadcastBanner />
      <div className="flex flex-1 overflow-hidden">
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
            onShowSettings={handleShowSettings}
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
    </div>
  );
}

    
    
