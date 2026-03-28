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
        | null
        | undefined;
    };
  }
}

const PHONE_NUMBER_REGEX = /^\+[1-9][0-9]{6,14}$/;

const isPhoneNumber = (value: unknown): value is string =>
  typeof value === 'string' && PHONE_NUMBER_REGEX.test(value);

export const normalizePhoneNumber = (value: unknown): string | null => {
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
  const normalized = withInternationalPrefix.startsWith('+')
    ? `+${withInternationalPrefix.slice(1).replace(/\D/g, '')}`
    : withInternationalPrefix.replace(/\D/g, '');

  return isPhoneNumber(normalized) ? normalized : null;
};

export const normalizeNativeContacts = (
  contacts: NativeContactRecord[]
): NormalizedNativeContact[] => {
  const dedupedContacts = new Map<string, string>();

  contacts.forEach((contact) => {
    const normalizedPhone = normalizePhoneNumber(contact.phone);
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
  typeof window.NativeContacts?.getContacts === 'function';

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
