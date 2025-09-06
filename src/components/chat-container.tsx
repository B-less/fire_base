
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Contact, Message, User } from '@/lib/types';
import { ContactList } from '@/components/contact-list';
import { ChatPanel } from '@/components/chat-panel';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateSmartReplies, SmartReplyOutput } from '@/ai/flows/smart-reply-suggestions';
import { generateChatResponse } from '@/ai/flows/conversational-ai-flow';
import { sendPushNotification } from '@/ai/flows/push-notification-flow';
import { Plus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { ref, onValue, set, push, get, child, query, orderByChild, limitToLast, remove } from 'firebase/database';

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
  const [isContactsLoading, setIsContactsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const isMobile = useIsMobile();

  const activeContact = contacts.find((c) => c.id === activeContactId);

  // Load contacts and their last messages
  useEffect(() => {
    if (!currentUser) return;
    setIsContactsLoading(true);
  
    const contactsRef = ref(db, `users/${currentUser.phoneNumber}/contacts`);
  
    const unsubscribe = onValue(contactsRef, (snapshot) => {
      const contactIds: string[] = snapshot.val() || [];
      if (!Array.isArray(contactIds)) {
        setIsContactsLoading(false);
        return;
      };
  
      const contactsPromises = contactIds.map(async (id: string) => {
        try {
          const userSnap = await get(child(ref(db), `users/${id}`));
          if (!userSnap.exists()) return null;
          const userData = userSnap.val();
  
          const conversationKey = getConversationKey(currentUser.phoneNumber, id);
          const messagesQuery = query(ref(db, `messages/${conversationKey}`), orderByChild('id'), limitToLast(1));
          
          const messageSnap = await get(messagesQuery);
          let lastMessage: Message | undefined;
          if (messageSnap.exists()) {
             const messagesData = messageSnap.val();
             lastMessage = Object.values(messagesData)[0] as Message | undefined;
          }
  
          return {
            id: userData.phoneNumber,
            name: userData.name,
            avatar: `https://picsum.photos/seed/${id}/100/100`,
            online: false, 
            lastMessage: lastMessage ? (lastMessage.content || (lastMessage.image ? "Image" : '')) : 'No messages yet',
            lastMessageTime: lastMessage ? lastMessage.timestamp : '',
            unreadCount: 0,
            messages: [], // Initially empty, will be loaded on demand
          };
        } catch (error) {
          console.error("Error fetching contact data for ID:", id, error);
          return null;
        }
      });
  
      Promise.all(contactsPromises).then(resolvedContacts => {
        const validContacts = resolvedContacts.filter((c): c is Contact => c !== null);
        
         setContacts(prevContacts => {
            const aiContact = prevContacts.find(c => c.id === AI_CONTACT_ID);
            const existingContactIds = new Set(prevContacts.map(c => c.id));
            const newContacts = validContacts.filter(c => !existingContactIds.has(c.id));
            
            const finalContacts = [...prevContacts.filter(c => validContacts.some(vc => vc.id === c.id)), ...newContacts];
            if(aiContact && !finalContacts.some(c => c.id === AI_CONTACT_ID)) {
                return [aiContact, ...finalContacts];
            }
            return finalContacts;
         });
         setIsContactsLoading(false);
      });
    });
  
    return () => unsubscribe();
  }, [currentUser]);


  // Real-time messages for active chat
  useEffect(() => {
    if (!currentUser || !activeContactId || activeContactId === AI_CONTACT_ID) {
      if (isMessagesLoading) setIsMessagesLoading(false);
      return;
    }

    setIsMessagesLoading(true);
    const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
    const messagesRef = ref(db, `messages/${conversationKey}`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
        const messagesData = snapshot.val() || {};
        const messages: Message[] = Object.values(messagesData);
        
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

        setContacts(prevContacts => prevContacts.map(c => {
            if (c.id === activeContactId) {
                return { 
                    ...c, 
                    messages: messages.sort((a,b) => a.id - b.id),
                    lastMessage: lastMessage ? (lastMessage.content || (lastMessage.image ? 'Image' : '')) : c.lastMessage,
                    lastMessageTime: lastMessage ? lastMessage.timestamp : c.lastMessageTime
                };
            }
            return c;
        }));
        setIsMessagesLoading(false);
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
    // Fetch current contacts before updating
    const snapshot = await get(currentUserContactsRef);
    const currentContacts = snapshot.val() || [];
    if (!currentContacts.includes(user.phoneNumber)) {
      const newContacts = [...currentContacts, user.phoneNumber];
      await set(currentUserContactsRef, newContacts);
    }

    // Add current user to the new contact's contacts in DB
    const newContactUserRef = ref(db, `users/${user.phoneNumber}`);
    onValue(newContactUserRef, async (snapshot) => {
        const newContactUserData = snapshot.val();
        if (newContactUserData) {
          const existingContacts = newContactUserData.contacts || [];
          if(!existingContacts.includes(currentUser.phoneNumber)) {
              const newContactContactsRef = ref(db, `users/${user.phoneNumber}/contacts`);
              await set(newContactContactsRef, [...existingContacts, currentUser.phoneNumber]);
          }
        }
    }, { onlyOnce: true });

    // The onValue listener on contacts should pick this up automatically.
    // If not, we can add it manually.
    if (!contacts.some(c => c.id === user.phoneNumber)) {
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
        setContacts(prev => [...prev, newContact]);
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
    }
    handleSelectContact(AI_CONTACT_ID);
  };

  const handleBackToContacts = () => {
    setShowChatPanel(false);
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
        
        // Trigger push notification
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
        const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
        const messagesRef = ref(db, `messages/${conversationKey}`);

        get(messagesRef).then(snapshot => {
            if(snapshot.exists()) {
                const messagesData = snapshot.val();
                let messageKeyToUpdate: string | undefined;

                for (const key in messagesData) {
                    if (messagesData[key].id === messageId) {
                        messageKeyToUpdate = key;
                        break;
                    }
                }
                
                if (messageKeyToUpdate) {
                    const messageToUpdateRef = ref(db, `messages/${conversationKey}/${messageKeyToUpdate}`);
                    const dbMessage = messagesData[messageKeyToUpdate];
                    
                    const updatedMessage: any = {
                        ...dbMessage,
                        content: content,
                    };
                    
                    if (image !== undefined) {
                        updatedMessage.image = image;
                    }

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
        });
    }
  }

  const handleDeleteMessage = (messageId: number, dbKey?: string) => {
    if (!activeContactId || !currentUser) return;
    
    if (activeContactId === AI_CONTACT_ID) {
        // Just remove from local state for AI chat
        setContacts(prev => prev.map(c => {
            if (c.id === AI_CONTACT_ID) {
                return { ...c, messages: c.messages.filter(m => m.id !== messageId) };
            }
            return c;
        }));
    } else {
        // Remove from Firebase for real users
        const conversationKey = getConversationKey(currentUser.phoneNumber, activeContactId);
        if (dbKey) {
            const messageRef = ref(db, `messages/${conversationKey}/${dbKey}`);
            remove(messageRef);
        } else {
             console.error("Cannot delete message without a database key.");
             // Fallback: try to find it, but this is inefficient
             const messagesRef = ref(db, `messages/${conversationKey}`);
             get(messagesRef).then(snapshot => {
                if(snapshot.exists()) {
                    const messagesData = snapshot.val();
                    for (const key in messagesData) {
                        if (messagesData[key].id === messageId) {
                             remove(ref(db, `messages/${conversationKey}/${key}`));
                            break;
                        }
                    }
                }
             });
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
  
  useEffect(() => {
    if (!isMobile) {
      setShowChatPanel(true);
    } else {
       setShowChatPanel(activeContactId !== null);
    }
  }, [isMobile, activeContactId]);

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
          isMobile && showChatPanel ? 'w-0 -translate-x-full' : 'w-full md:w-1/3 lg:w-1/4'
        }`}
      >
        <ContactList
          contacts={contacts}
          activeContactId={activeContactId}
          onSelectContact={handleSelectContact}
          onAddContact={handleAddContact}
          onStartAIChat={handleStartAIChat}
          isLoading={isContactsLoading}
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
            onDeleteMessage={handleDeleteMessage}
            onBack={isMobile ? handleBackToContacts : undefined}
            smartReplies={smartReplies}
            setSmartReplies={setSmartReplies}
            isLoading={isMessagesLoading}
          />
        ) : (
           <NoContactsView />
        )}
      </div>
    </div>
  );
}
