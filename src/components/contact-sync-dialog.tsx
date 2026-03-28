'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Users } from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  inferDialCodeFromPhoneNumber,
  isNativeContactsBridgeAvailable,
  normalizeNativeContacts,
} from '@/lib/contacts';
import type { MatchedContact, PublicUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const CONTACT_MATCH_BATCH_SIZE = 200;

type ContactSyncCache = {
  matches: MatchedContact[];
  syncedAt: string;
};

const chunkPhones = (phones: string[], size: number) => {
  const chunks: string[][] = [];
  for (let index = 0; index < phones.length; index += size) {
    chunks.push(phones.slice(index, index + size));
  }
  return chunks;
};

const toPublicUser = (contact: MatchedContact): PublicUser => ({
  phoneNumber: contact.phone,
  name: contact.name,
  profilePicture: contact.profilePicture,
});

export function ContactSyncDialog({
  existingContactIds,
  onOpenChat,
  children,
}: {
  existingContactIds: string[];
  onOpenChat: (user: PublicUser) => Promise<void> | void;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [matches, setMatches] = useState<MatchedContact[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const cacheKey = user?.phoneNumber
    ? `chirpchat-contact-sync-cache-v1:${user.phoneNumber}`
    : null;

  useEffect(() => {
    if (!open || !cacheKey) {
      return;
    }

    try {
      const cachedValue = localStorage.getItem(cacheKey);
      if (!cachedValue) {
        return;
      }

      const parsedCache = JSON.parse(cachedValue) as ContactSyncCache;
      if (Array.isArray(parsedCache.matches)) {
        setMatches(parsedCache.matches);
      }
      if (typeof parsedCache.syncedAt === 'string') {
        setLastSyncedAt(parsedCache.syncedAt);
      }
    } catch (error) {
      console.warn('Failed to read cached contact sync results.', error);
    }
  }, [open, cacheKey]);

  const handleSyncContacts = async () => {
    if (!isNativeContactsBridgeAvailable()) {
      setStatusMessage('Contact sync is only available in the mobile app.');
      toast({
        title: 'Native contacts unavailable',
        description: 'Open Chirp Chat inside the app wrapper to sync local contacts.',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    setStatusMessage(null);

    try {
      const rawContacts = await window.NativeContacts!.getContacts();
      const contactList = Array.isArray(rawContacts)
        ? rawContacts
        : typeof rawContacts === 'string'
          ? (() => {
              try {
                const parsedContacts = JSON.parse(rawContacts);
                return Array.isArray(parsedContacts) ? parsedContacts : [];
              } catch {
                return [];
              }
            })()
          : [];
      const defaultDialCode = user?.phoneNumber
        ? inferDialCodeFromPhoneNumber(user.phoneNumber)
        : null;
      const normalizedContacts = normalizeNativeContacts(
        contactList,
        defaultDialCode
      ).filter((contact) => contact.phone !== user?.phoneNumber);

      if (normalizedContacts.length === 0) {
        setMatches([]);
        setLastSyncedAt(null);
        setStatusMessage('No contacts found');
        return;
      }

      const contactNameByPhone = normalizedContacts.reduce<Record<string, string>>(
        (accumulator, contact) => {
          accumulator[contact.phone] = contact.name;
          return accumulator;
        },
        {}
      );

      const uniquePhones = normalizedContacts.map((contact) => contact.phone);
      const batches = chunkPhones(uniquePhones, CONTACT_MATCH_BATCH_SIZE);
      const responses = await Promise.all(
        batches.map(async (phones) => {
          const response = await fetch('/api/contacts/match', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phones }),
          });

          if (!response.ok) {
            throw new Error('Could not match contacts right now.');
          }

          return (await response.json()) as MatchedContact[];
        })
      );

      const mergedMatches = Array.from(
        new Map(
          responses
            .flat()
            .map((match) => [
              match.phone,
              {
                ...match,
                localName: contactNameByPhone[match.phone] || undefined,
              },
            ])
        ).values()
      ).sort((left, right) => left.name.localeCompare(right.name));

      if (mergedMatches.length === 0) {
        setMatches([]);
        setLastSyncedAt(null);
        setStatusMessage('No users on Chirp Chat');
        return;
      }

      setMatches(mergedMatches);
      const syncedAt = new Date().toISOString();
      setLastSyncedAt(syncedAt);
      setStatusMessage(null);

      if (cacheKey) {
        const cachePayload: ContactSyncCache = {
          matches: mergedMatches,
          syncedAt,
        };
        localStorage.setItem(cacheKey, JSON.stringify(cachePayload));
      }
    } catch (error) {
      console.error('Failed to sync contacts.', error);
      setStatusMessage('We could not sync contacts right now');
      toast({
        title: 'Sync failed',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredMatches = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) {
      return matches;
    }

    return matches.filter((contact) => {
      const localName = contact.localName?.toLowerCase() || '';
      return (
        contact.name.toLowerCase().includes(normalizedSearch) ||
        contact.phone.toLowerCase().includes(normalizedSearch) ||
        localName.includes(normalizedSearch)
      );
    });
  }, [matches, searchTerm]);

  const handleOpenChat = async (contact: MatchedContact) => {
    await onOpenChat(toPublicUser(contact));
    setOpen(false);
  };

  const renderContent = () => {
    if (isSyncing) {
      return (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Syncing contacts…</p>
        </div>
      );
    }

    if (statusMessage) {
      return (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium">{statusMessage}</p>
            <p className="text-sm text-muted-foreground">
              Tap sync to try again after updating your local contacts.
            </p>
          </div>
        </div>
      );
    }

    if (matches.length === 0) {
      return (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium">Ready to sync your contacts</p>
            <p className="text-sm text-muted-foreground">
              We’ll compare phone numbers from your device with Chirp Chat users.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <Input
          placeholder="Search matched contacts"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {filteredMatches.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              No matched contacts for “{searchTerm}”.
            </div>
          ) : (
            filteredMatches.map((contact) => {
              const alreadyInChats = existingContactIds.includes(contact.phone);
              return (
                <div
                  key={contact.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2.5 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{contact.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{contact.phone}</p>
                    {contact.localName &&
                    contact.localName !== contact.name ? (
                      <p className="truncate text-xs text-muted-foreground/80">
                        Saved as {contact.localName}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {alreadyInChats ? (
                      <span className="text-xs text-muted-foreground">In chats</span>
                    ) : null}
                    <Button size="sm" onClick={() => void handleOpenChat(contact)}>
                      Chat
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Sync Contacts</DialogTitle>
          <DialogDescription>
            Match phone numbers from your device with people already using Chirp Chat.
          </DialogDescription>
        </DialogHeader>

        {lastSyncedAt ? (
          <p className="text-xs text-muted-foreground">
            Last synced {new Date(lastSyncedAt).toLocaleString()}
          </p>
        ) : null}

        {renderContent()}

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleSyncContacts}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {matches.length > 0 ? 'Sync again' : 'Sync contacts'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
