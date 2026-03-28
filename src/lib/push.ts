import type { User } from '@/lib/types';

export const encodePushTokenKey = (token: string) => encodeURIComponent(token);

export const extractFcmTokens = (user?: Pick<User, 'fcmToken' | 'fcmTokens'> | null) => {
  const tokens = new Set<string>();

  if (user?.fcmToken) {
    tokens.add(user.fcmToken);
  }

  if (user?.fcmTokens) {
    Object.values(user.fcmTokens).forEach((value) => {
      if (typeof value === 'string' && value) {
        tokens.add(value);
        return;
      }

      if (value && typeof value === 'object' && typeof value.token === 'string' && value.token) {
        tokens.add(value.token);
      }
    });
  }

  return Array.from(tokens);
};

export const getPushPreviewText = (message: string) => {
  const trimmed = message.trim();
  return trimmed || 'Sent you a media file.';
};
