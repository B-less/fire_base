import { countries } from '@/lib/countries';

export type NativeContactRecord = {
  name?: string | null;
  phone?: string | null;
};

export type NormalizedNativeContact = {
  name: string;
  phone: string;
};

declare global {
  interface Window {
    NativeContacts?: {
      getContacts: () =>
        | Promise<NativeContactRecord[]>
        | NativeContactRecord[]
        | Promise<string>
        | string
        | null
        | undefined;
    };
    AndroidNativeContacts?: {
      requestContacts: (callbackId: string) => void;
    };
    __nativeContactsResolve?: (callbackId: string, payload: string) => void;
    __nativeContactsReject?: (callbackId: string, error: string) => void;
  }
}

const nativeContactsRequests = new Map<
  string,
  {
    resolve: (contacts: NativeContactRecord[]) => void;
    reject: (error: Error) => void;
  }
>();
let nativeContactsRequestCounter = 0;

const ensureAndroidNativeContactsBridge = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.NativeContacts || typeof window.AndroidNativeContacts?.requestContacts !== 'function') {
    return typeof window.NativeContacts?.getContacts === 'function';
  }

  window.__nativeContactsResolve = (callbackId, payload) => {
    const pendingRequest = nativeContactsRequests.get(callbackId);
    if (!pendingRequest) {
      return;
    }

    nativeContactsRequests.delete(callbackId);

    try {
      const parsedPayload = JSON.parse(payload);
      pendingRequest.resolve(Array.isArray(parsedPayload) ? parsedPayload : []);
    } catch (error) {
      pendingRequest.reject(
        error instanceof Error ? error : new Error('Could not parse contacts payload.')
      );
    }
  };

  window.__nativeContactsReject = (callbackId, error) => {
    const pendingRequest = nativeContactsRequests.get(callbackId);
    if (!pendingRequest) {
      return;
    }

    nativeContactsRequests.delete(callbackId);
    pendingRequest.reject(new Error(error || 'Unable to access native contacts.'));
  };

  window.NativeContacts = {
    getContacts: () =>
      new Promise<NativeContactRecord[]>((resolve, reject) => {
        const callbackId = `native-contact-request-${nativeContactsRequestCounter += 1}`;
        nativeContactsRequests.set(callbackId, { resolve, reject });

        try {
          window.AndroidNativeContacts!.requestContacts(callbackId);
        } catch (error) {
          nativeContactsRequests.delete(callbackId);
          reject(
            error instanceof Error
              ? error
              : new Error('Unable to access native contacts.')
          );
        }
      }),
  };

  return true;
};

const PHONE_NUMBER_REGEX = /^\+[1-9][0-9]{6,14}$/;

const isPhoneNumber = (value: unknown): value is string =>
  typeof value === 'string' && PHONE_NUMBER_REGEX.test(value);

export const normalizePhoneNumber = (value: unknown): string | null => {
  return normalizePhoneNumberForRegion(value);
};

export const inferDialCodeFromPhoneNumber = (phoneNumber: string): string | null => {
  const compactPhone = phoneNumber.replace(/\D/g, '');
  if (!compactPhone) {
    return null;
  }

  const sortedDialCodes = [...countries]
    .map((country) => country.dial_code)
    .sort((left, right) => right.length - left.length);

  const matchedDialCode = sortedDialCodes.find((dialCode) =>
    compactPhone.startsWith(dialCode.replace('+', ''))
  );

  return matchedDialCode ?? null;
};

export const normalizePhoneNumberForRegion = (
  value: unknown,
  defaultDialCode?: string | null
): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const compact = trimmed.replace(/[\s\-().]/g, '');
  const withInternationalPrefix = compact.startsWith('00')
    ? `+${compact.slice(2)}`
    : compact;
  const digitsOnly = withInternationalPrefix.replace(/\D/g, '');
  const normalizedDefaultDialCode =
    typeof defaultDialCode === 'string' && defaultDialCode.startsWith('+')
      ? defaultDialCode
      : null;

  let normalized = withInternationalPrefix.startsWith('+')
    ? `+${withInternationalPrefix.slice(1).replace(/\D/g, '')}`
    : digitsOnly;

  if (!normalized.startsWith('+') && normalizedDefaultDialCode) {
    const defaultDigits = normalizedDefaultDialCode.replace('+', '');
    if (normalized.startsWith(defaultDigits)) {
      normalized = `+${normalized}`;
    } else if (normalized.startsWith('0')) {
      normalized = `${normalizedDefaultDialCode}${normalized.slice(1)}`;
    } else {
      normalized = `${normalizedDefaultDialCode}${normalized}`;
    }
  }

  return isPhoneNumber(normalized) ? normalized : null;
};

export const normalizeNativeContacts = (
  contacts: NativeContactRecord[],
  defaultDialCode?: string | null
): NormalizedNativeContact[] => {
  const dedupedContacts = new Map<string, string>();

  contacts.forEach((contact) => {
    const normalizedPhone = normalizePhoneNumberForRegion(
      contact.phone,
      defaultDialCode
    );
    if (!normalizedPhone) {
      return;
    }

    const normalizedName =
      typeof contact.name === 'string' ? contact.name.trim() : '';

    if (!dedupedContacts.has(normalizedPhone) || normalizedName) {
      dedupedContacts.set(normalizedPhone, normalizedName);
    }
  });

  return Array.from(dedupedContacts.entries()).map(([phone, name]) => ({
    phone,
    name,
  }));
};

export const isNativeContactsBridgeAvailable = () =>
  typeof window !== 'undefined' &&
  (ensureAndroidNativeContactsBridge() ||
    typeof window.NativeContacts?.getContacts === 'function');

export const normalizeContactIds = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map(normalizePhoneNumber)
      .filter((contactId): contactId is string => contactId !== null);
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const fromValues = entries
      .map(([, contactId]) => normalizePhoneNumber(contactId))
      .filter((contactId): contactId is string => contactId !== null);
    const fromTruthyKeys = entries
      .filter(([contactId, enabled]) => normalizePhoneNumber(contactId) && enabled === true)
      .map(([contactId]) => normalizePhoneNumber(contactId))
      .filter((contactId): contactId is string => contactId !== null);

    return [...new Set([...fromValues, ...fromTruthyKeys])];
  }

  return [];
};

export const toContactMap = (value: unknown): Record<string, true> =>
  normalizeContactIds(value).reduce<Record<string, true>>((contacts, contactId) => {
    contacts[contactId] = true;
    return contacts;
  }, {});
