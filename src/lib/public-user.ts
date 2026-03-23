import { db } from '@/lib/firebase';
import { get, onValue, ref } from 'firebase/database';

export type PublicUserProfile = {
  phoneNumber: string;
  name: string;
  profilePicture?: string;
  status?: {
    online: boolean;
    lastSeen: number | object;
  };
};

type PublicUserState = {
  name?: unknown;
  profilePicture?: unknown;
  online?: unknown;
  lastSeen?: unknown;
};

const publicFieldRefs = (phoneNumber: string) => ({
  name: ref(db, `users/${phoneNumber}/name`),
  profilePicture: ref(db, `users/${phoneNumber}/profilePicture`),
  online: ref(db, `users/${phoneNumber}/status/online`),
  lastSeen: ref(db, `users/${phoneNumber}/status/lastSeen`),
});

const buildPublicUserProfile = (
  phoneNumber: string,
  state: PublicUserState
): PublicUserProfile | null => {
  if (typeof state.name !== 'string' || !state.name.trim()) {
    return null;
  }

  const status =
    typeof state.online === 'boolean' || state.lastSeen !== undefined
      ? {
          online: state.online === true,
          lastSeen:
            typeof state.lastSeen === 'number' ||
            (typeof state.lastSeen === 'object' && state.lastSeen !== null)
              ? state.lastSeen
              : 0,
        }
      : undefined;

  return {
    phoneNumber,
    name: state.name,
    profilePicture: typeof state.profilePicture === 'string' ? state.profilePicture : undefined,
    status,
  };
};

export async function getPublicUser(phoneNumber: string): Promise<PublicUserProfile | null> {
  const refs = publicFieldRefs(phoneNumber);
  const [nameSnapshot, profilePictureSnapshot, onlineSnapshot, lastSeenSnapshot] =
    await Promise.all([
      get(refs.name),
      get(refs.profilePicture),
      get(refs.online),
      get(refs.lastSeen),
    ]);

  return buildPublicUserProfile(phoneNumber, {
    name: nameSnapshot.val(),
    profilePicture: profilePictureSnapshot.val(),
    online: onlineSnapshot.val(),
    lastSeen: lastSeenSnapshot.val(),
  });
}

export function subscribeToPublicUser(
  phoneNumber: string,
  onChange: (user: PublicUserProfile | null) => void
) {
  const refs = publicFieldRefs(phoneNumber);
  const state: PublicUserState = {};
  const subscriptions: Array<() => void> = [];

  const emit = () => {
    onChange(buildPublicUserProfile(phoneNumber, state));
  };

  Object.entries(refs).forEach(([field, fieldRef]) => {
    const unsubscribe = onValue(
      fieldRef,
      (snapshot) => {
        state[field as keyof PublicUserState] = snapshot.val();
        emit();
      },
      () => {
        onChange(null);
      }
    );

    subscriptions.push(unsubscribe);
  });

  return () => {
    subscriptions.forEach((unsubscribe) => unsubscribe());
  };
}
