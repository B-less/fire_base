const isPhoneNumber = (value: unknown): value is string =>
  typeof value === 'string' && /^\+[1-9][0-9]{6,14}$/.test(value);

export const normalizeContactIds = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter(isPhoneNumber);
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const fromValues = entries
      .map(([, contactId]) => contactId)
      .filter(isPhoneNumber);
    const fromTruthyKeys = entries
      .filter(([contactId, enabled]) => isPhoneNumber(contactId) && enabled === true)
      .map(([contactId]) => contactId);

    return [...new Set([...fromValues, ...fromTruthyKeys])];
  }

  return [];
};

export const toContactMap = (value: unknown): Record<string, true> =>
  normalizeContactIds(value).reduce<Record<string, true>>((contacts, contactId) => {
    contacts[contactId] = true;
    return contacts;
  }, {});
