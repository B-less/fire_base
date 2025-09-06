import type { Contact, Message } from './types';

// This file is no longer the primary source of truth,
// but can be kept for reference or type definitions if needed.

export const CONTACTS: Contact[] = [];

export type AllMessages = {
    [key: string]: Message[];
}
