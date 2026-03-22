'use client';

export type MedianPermissionName =
  | 'Microphone'
  | 'Notifications'
  | 'Contacts'
  | 'Camera'
  | 'PhotoLibrary'
  | 'LocationAlways'
  | 'LocationWhenInUse'
  | 'AppTrackingTransparency';

export type MedianPermissionState = 'denied' | 'granted' | 'undetermined' | 'unknown';

type PermissionStatusResponse = Partial<Record<MedianPermissionName, MedianPermissionState>>;

type MedianOneSignalInfo = {
  oneSignalId?: string;
  externalId?: string;
  subscription?: {
    id?: string;
    token?: string;
  };
};

type MedianBridge = {
  permissions?: {
    status?: (permissions?: MedianPermissionName[]) => Promise<PermissionStatusResponse>;
  };
  open?: {
    appSettings?: () => void;
  };
  onesignal?: {
    register?: () => Promise<void> | void;
    login?: (externalId: string) => Promise<void> | void;
    logout?: () => Promise<void> | void;
    info?: () => Promise<MedianOneSignalInfo> | MedianOneSignalInfo;
    userPrivacyConsent?: {
      grant?: () => Promise<void> | void;
      revoke?: () => Promise<void> | void;
    };
  };
  android?: {
    fcm?: {
      getRegistrationId?: (callback: (token: string) => void) => void;
    };
  };
};

declare global {
  interface Window {
    median?: MedianBridge;
  }
}

const getMedianBridge = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.median ?? null;
};

export const isMedianApp = () => !!getMedianBridge();

export const getMedianPermissionStatus = async (
  permissions?: MedianPermissionName[]
): Promise<PermissionStatusResponse> => {
  const median = getMedianBridge();
  if (!median?.permissions?.status) {
    return {};
  }

  try {
    return await median.permissions.status(permissions);
  } catch (error) {
    console.error('Failed to read Median permission status:', error);
    return {};
  }
};

export const openMedianAppSettings = () => {
  const median = getMedianBridge();
  median?.open?.appSettings?.();
};

export const requestMedianPushRegistration = async () => {
  const median = getMedianBridge();
  if (!median?.onesignal?.register) {
    return;
  }

  await median.onesignal.register();
};

export const loginMedianPushUser = async (externalId: string) => {
  const median = getMedianBridge();
  if (!median?.onesignal?.login) {
    return null;
  }

  await median.onesignal.login(externalId);

  if (!median.onesignal.info) {
    return null;
  }

  return await median.onesignal.info();
};

export const logoutMedianPushUser = async () => {
  const median = getMedianBridge();
  if (!median?.onesignal?.logout) {
    return;
  }

  await median.onesignal.logout();
};

export const getMedianPushInfo = async () => {
  const median = getMedianBridge();
  if (!median?.onesignal?.info) {
    return null;
  }

  return await median.onesignal.info();
};
